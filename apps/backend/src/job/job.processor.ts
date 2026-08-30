import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { z } from 'zod';
import { GenerateJob, GenerateStage } from '../../type';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { BackupService } from '../backup/backup.service';
import { OpenAiService } from '../openai/openai.service';
import { ReplicateService } from '../replicate/replicate.service';

const JobMessageSchema = z.object({
  jobId: z.string().uuid(),
  key: z.string().min(1),
  mode: z.enum(['animated', 'audiolized']),
});

@Injectable()
export class JobProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobProcessor.name);
  private readonly sqs = new SQSClient({ region: process.env.AWS_REGION });
  private readonly queueUrl = process.env.AWS_SQS_URL;
  private readonly visibilitySeconds = Number(
    process.env.SQS_VISIBILITY_TIMEOUT_SECONDS ?? 300,
  );
  private readonly maxReceiveCount = Number(process.env.SQS_MAX_RECEIVES ?? 3);
  private timer?: NodeJS.Timeout;
  private isPolling = false;
  private shuttingDown = false;

  constructor(
    private readonly replicate: ReplicateService,
    private readonly s3: S3Service,
    private readonly db: DynamoDbService,
    private readonly openAi: OpenAiService,
    private readonly backup: BackupService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.poll(), 5000);
    void this.poll();
  }

  onModuleDestroy() {
    this.shuttingDown = true;
    if (this.timer) clearInterval(this.timer);
  }

  async poll() {
    if (this.isPolling || this.shuttingDown || !this.queueUrl) return;
    this.isPolling = true;
    try {
      const { Messages } = await this.sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 10,
          VisibilityTimeout: this.visibilitySeconds,
          MessageSystemAttributeNames: ['ApproximateReceiveCount'],
        }),
      );

      for (const message of Messages ?? []) await this.handleMessage(message);
    } catch (error) {
      this.logger.error('SQS polling failed', this.errorText(error));
    } finally {
      this.isPolling = false;
    }
  }

  private async handleMessage(message: Message) {
    const receiveCount = Number(
      message.Attributes?.ApproximateReceiveCount ?? 1,
    );
    let jobId: string | undefined;
    const stopHeartbeat = this.startVisibilityHeartbeat(message);

    try {
      const parsed = JobMessageSchema.safeParse(JSON.parse(message.Body ?? ''));
      if (!parsed.success)
        throw new Error(`Invalid job message: ${parsed.error.message}`);
      jobId = parsed.data.jobId;

      const existing = (await this.db.get(jobId)) as GenerateJob | undefined;
      if (!existing) throw new Error(`Job not found: ${jobId}`);
      if (existing.status !== 'DONE') await this.processOne(existing);

      await this.deleteMessage(message);
      this.logger.log(`job=${jobId} completed receiveCount=${receiveCount}`);
    } catch (error) {
      const reason = this.errorText(error);
      this.logger.error(
        `job=${jobId ?? 'unknown'} failed receiveCount=${receiveCount}`,
        reason,
      );
      if (jobId && receiveCount >= this.maxReceiveCount) {
        await this.db
          .markFailed(jobId, reason)
          .catch((dbError) =>
            this.logger.error(
              `job=${jobId} failed to persist terminal error`,
              this.errorText(dbError),
            ),
          );
      }
      // Do not delete. SQS retries and the queue redrive policy eventually sends it to the DLQ.
    } finally {
      stopHeartbeat();
    }
  }

  private async processOne(job: GenerateJob) {
    const startedAt = Date.now();
    switch (job.mode) {
      case 'animated':
        await this.processAnimated(job);
        break;
      case 'audiolized':
        await this.processAudiolized(job);
        break;
    }
    this.logger.log(`job=${job.jobId} processingMs=${Date.now() - startedAt}`);
  }

  private async processAnimated(job: GenerateJob) {
    let stage = job.currentStage ?? 'PENDING';
    let cleanedImageKey = job.cleanedImageKey;
    let generatedVideoKey = job.generatedVideoKey;
    const outputKey = job.outputKey ?? `results/${job.jobId}.gif`;

    if (stage === 'PENDING') {
      const inputUrl = await this.s3.getDownloadUrl(job.inputKey);
      const resultUrl = await this.replicate.cleanImage(inputUrl);
      cleanedImageKey = `checkpoints/${job.jobId}/cleaned.jpg`;
      await this.backup.copyFromUrl(resultUrl, cleanedImageKey, 'image/jpeg');
      await this.checkpoint(job.jobId, stage, 'IMAGE_CLEANED', {
        cleanedImageKey,
      });
      stage = 'IMAGE_CLEANED';
    }

    if (stage === 'IMAGE_CLEANED') {
      if (!cleanedImageKey) throw new Error('Missing cleaned image checkpoint');
      const cleanedUrl = await this.s3.getDownloadUrl(cleanedImageKey);
      const resultUrl = await this.replicate.animateImage(cleanedUrl);
      generatedVideoKey = `checkpoints/${job.jobId}/animated.mp4`;
      await this.backup.copyFromUrl(resultUrl, generatedVideoKey, 'video/mp4');
      await this.checkpoint(job.jobId, stage, 'VIDEO_GENERATED', {
        generatedVideoKey,
      });
      stage = 'VIDEO_GENERATED';
    }

    if (stage === 'VIDEO_GENERATED') {
      if (!generatedVideoKey) throw new Error('Missing video checkpoint');
      const videoUrl = await this.s3.getDownloadUrl(generatedVideoKey);
      const resultUrl = await this.replicate.convertVideoToGif(videoUrl);
      await this.backup.copyFromUrl(resultUrl, outputKey, 'image/gif');
      await this.checkpoint(job.jobId, stage, 'GIF_GENERATED', { outputKey });
      stage = 'GIF_GENERATED';
    }

    if (stage === 'GIF_GENERATED') await this.db.markDone(job.jobId, outputKey);
  }

  private async processAudiolized(job: GenerateJob) {
    let stage = job.currentStage ?? 'PENDING';
    let extractedMood = job.extractedMood;
    const outputKey = job.outputKey ?? `results/${job.jobId}.mp3`;

    if (stage === 'PENDING') {
      const inputUrl = await this.s3.getDownloadUrl(job.inputKey);
      extractedMood = await this.openAi.extractMoodFromImage(inputUrl);
      await this.checkpoint(job.jobId, stage, 'MOOD_EXTRACTED', {
        extractedMood,
      });
      stage = 'MOOD_EXTRACTED';
    }

    if (stage === 'MOOD_EXTRACTED') {
      if (!extractedMood) throw new Error('Missing mood checkpoint');
      const resultUrl = await this.replicate.makeAudio(extractedMood);
      await this.backup.copyFromUrl(resultUrl, outputKey, 'audio/mpeg');
      await this.checkpoint(job.jobId, stage, 'AUDIO_GENERATED', { outputKey });
      stage = 'AUDIO_GENERATED';
    }

    if (stage === 'AUDIO_GENERATED')
      await this.db.markDone(job.jobId, outputKey);
  }

  private async checkpoint(
    jobId: string,
    expectedStage: GenerateStage,
    nextStage: GenerateStage,
    artifacts: Record<string, string | undefined>,
  ) {
    const definedArtifacts = Object.fromEntries(
      Object.entries(artifacts).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    );
    await this.db.saveCheckpoint(
      jobId,
      expectedStage,
      nextStage,
      definedArtifacts,
    );
  }

  private startVisibilityHeartbeat(message: Message) {
    const intervalMs = Math.max(1000, Math.floor(this.visibilitySeconds * 500));
    const timer = setInterval(() => {
      if (!message.ReceiptHandle || !this.queueUrl) return;
      void this.sqs
        .send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: this.visibilitySeconds,
          }),
        )
        .catch((error) =>
          this.logger.error(
            'SQS visibility heartbeat failed',
            this.errorText(error),
          ),
        );
    }, intervalMs);
    return () => clearInterval(timer);
  }

  private async deleteMessage(message: Message) {
    if (!message.ReceiptHandle || !this.queueUrl)
      throw new Error('Missing SQS receipt handle');
    await this.sqs.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
  }

  private errorText(error: unknown) {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
  }
}
