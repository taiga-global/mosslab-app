import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ReplicateService } from 'src/replicate/replicate.service';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';

@Injectable()
export class JobProcessor implements OnModuleInit {
  private sqs = new SQSClient({ region: process.env.AWS_REGION });
  private queueUrl = process.env.AWS_SQS_URL;

  constructor(
    private replicate: ReplicateService,
    private s3: S3Service,
    private db: DynamoDbService,
  ) {}

  onModuleInit() {
    setInterval(() => this.poll(), 5000);
  }

  async poll() {
    const { Messages } = await this.sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 5,
      }),
    );
    if (!Messages?.length) return;

    for (const m of Messages) {
      const { jobId, key } = JSON.parse(m.Body);
      try {
        // 1) S3 원본 다운로드 URL
        const srcUrl = this.s3.getDownloadUrl(key);

        // 2) Replicate 호출 (예시)
        const gifBuffer = await this.replicate.makeGif(srcUrl);

        // 3) 결과 업로드
        const outKey = `results/${jobId}.gif`;
        await this.s3.uploadImage(Buffer.from(gifBuffer), 'image/gif', outKey);

        // 4) 상태 업데이트
        await this.db.markDone(jobId, outKey);
      } finally {
        // 5) 큐 삭제
        await this.sqs.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: m.ReceiptHandle,
          }),
        );
      }
    }
  }
}
