import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { JobMessage } from 'type';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { BackupService } from '../backup/backup.service';
import { OpenAiService } from '../openai/openai.service';
import { ReplicateService } from '../replicate/replicate.service';

@Injectable()
export class JobProcessor implements OnModuleInit {
  private sqs = new SQSClient({ region: process.env.AWS_REGION });
  private queueUrl = process.env.AWS_SQS_URL;
  private isPolling = false;

  constructor(
    private replicate: ReplicateService,
    private s3: S3Service,
    private db: DynamoDbService,
    private openAi: OpenAiService,
    private backup: BackupService,
  ) {}

  onModuleInit() {
    setInterval(() => {
      this.poll().catch((err) => {
        console.error('poll() 실행 중 에러 발생:', err);
      });
    }, 5000);
  }

  async poll() {
    if (this.isPolling) return;
    this.isPolling = true;
    try {
      const { Messages } = await this.sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 10,
        }),
      );
      if (!Messages?.length) {
        // console.error('Message가 없습니다:', Messages);
        return;
      } else {
        console.log('Message: ', Messages);
      }

      for (const msg of Messages) {
        const ok = await this.processOne(msg).catch((e) => {
          console.error('[FAIL]', e);
          return false;
        });
        if (ok) {
          await this.sqs.send(
            new DeleteMessageCommand({
              QueueUrl: this.queueUrl,
              ReceiptHandle: msg.ReceiptHandle,
            }),
          );
        }
      }

      // for (const m of Messages) {
      //   const { jobId, key, mode } = JSON.parse(m.Body ?? '') as JobMessage;
      //   let outKey;
      //   if (!key) {
      //     console.error('SQS 메시지에 key가 없습니다:', m.Body);
      //     continue;
      //   }
      //   try {
      //     // 1) S3 원본 다운로드 URL
      //     console.log('1. S3 원본 다운로드 URL 생성 시작:', key);
      //     const srcUrl = await this.s3.getDownloadUrl(key);
      //     console.log('1. S3 원본 다운로드 URL 생성 성공:', srcUrl);

      //     let mood, downloadUrl;

      //     switch (mode) {
      //       case 'animated':
      //         // 2) Replicate 호출 (예시)
      //         outKey = `results/${jobId}.gif`;
      //         try {
      //           console.log('2. Replicate 변환 시작:', srcUrl);
      //           // gifBuffer = await this.replicate.makeGif(srcUrl);
      //           downloadUrl = await this.replicate.makeGif(srcUrl);
      //           console.log('2. Replicate 변환 성공');
      //         } catch (err) {
      //           console.error('2. Replicate 변환 에러:', err);
      //           // 실패 시
      //           await this.db.markFailed(
      //             jobId,
      //             'Replicate 변환 에러: ' + String(err),
      //           );
      //         }
      //         break;

      //       case 'audiolized':
      //         outKey = `results/${jobId}.mp3`;
      //         try {
      //           console.log('2. OpenAI 변환 시작:', srcUrl);
      //           mood = await this.openAi.extractMoodFromImage(srcUrl);
      //           console.log('2. OpenAI 변환 성공', mood);
      //         } catch (err) {
      //           console.error('2. OpenAI 변환 에러:', err);
      //           await this.db.markFailed(
      //             jobId,
      //             'OpenAI 변환 에러: ' + String(err),
      //           );
      //         }

      //         try {
      //           console.log('3. Replicate 변환 시작:', mood);
      //           downloadUrl = await this.replicate.makeAudio(mood);
      //           console.log('3. Replicate 변환 성공');
      //         } catch (err) {
      //           console.error('3. Replicate 변환 에러:', err);
      //           // 실패 시
      //           await this.db.markFailed(
      //             jobId,
      //             'Replicate 변환 에러: ' + String(err),
      //           );
      //         }

      //         break;
      //       default:
      //         break;
      //     }

      //     // 4) 상태 업데이트
      //     try {
      //       console.log('4. DB 상태 업데이트 시작:', jobId, downloadUrl);
      //       await this.db.markDone(jobId, downloadUrl);
      //       console.log('4. DB 상태 업데이트 성공:', jobId, downloadUrl);
      //     } catch (err) {
      //       console.error('4. DB 상태 업데이트 에러:', err);
      //       continue;
      //     }
      //   } finally {
      //     // 3) 결과 업로드

      //     try {
      //       console.log('3. S3 결과 업로드 시작:', outKey);
      //       await this.s3.uploadImage(
      //         Buffer.from(gifBuffer),
      //         'image/gif',
      //         outKey,
      //       );
      //       console.log('3. S3 결과 업로드 성공:', outKey);
      //     } catch (err) {
      //       console.error('3. S3 결과 업로드 에러:', err);
      //     }

      //     // 5) 큐 삭제
      //     try {
      //       console.log('5. SQS 메시지 삭제 시작');
      //       await this.sqs.send(
      //         new DeleteMessageCommand({
      //           QueueUrl: this.queueUrl,
      //           ReceiptHandle: m.ReceiptHandle,
      //         }),
      //       );
      //       console.log('5. SQS 메시지 삭제 성공');
      //     } catch (err) {
      //       console.error('5. SQS 메시지 삭제 에러:', err);
      //     }
      //   }
      // }
    } finally {
      this.isPolling = false;
    }
  }

  private async processOne(m: Message): Promise<void> {
    const { jobId, key, mode } = JSON.parse(m.Body ?? '') as JobMessage;
    if (!key) throw new InternalServerErrorException('key missing in message');

    /* 1. 원본 S3 presign */
    console.log('1. S3 원본 다운로드 URL 생성 시작:', key);
    const srcUrl = await this.s3.getDownloadUrl(key);
    console.log('1. S3 원본 다운로드 URL 생성 성공:', srcUrl);
    let cdnUrl = '';
    let outKey = '';
    let mimeType = 'image/gif'; // 기본값, 필요시 변경
    /* 2. 변환 */
    if (mode === 'animated') {
      try {
        console.log('2. Animated 변환 시작:', srcUrl);
        cdnUrl = await this.replicate.makeGif(srcUrl);
        console.log('2. Animated 변환 성공');
        outKey = `results/${jobId}.gif`;
      } catch (err) {
        console.error('2. Animated 변환 에러:', err);
        await this.db.markFailed(jobId, 'Animated 변환 에러: ' + String(err));
      }
    } else {
      try {
        mimeType = 'audio/mpeg'; // 예시로 MP3로 설정
        console.log('2. Audiolized 변환 시작:', srcUrl);
        const mood = await this.openAi.extractMoodFromImage(srcUrl);
        cdnUrl = await this.replicate.makeAudio(mood);
        console.log('2. Audiolized 변환 성공');
        outKey = `results/${jobId}.mp3`;
      } catch (err) {
        console.error('2. Audiolized 변환 에러:', err);
        await this.db.markFailed(jobId, 'Audiolized 변환 에러: ' + String(err));
      }
    }

    /* 3. S3 백업(스트리밍)  ← 여기서 완료될 때까지 await */
    try {
      console.log('3. S3 백업 시작:', jobId, cdnUrl);
      await this.backup.copyFromUrl(cdnUrl, outKey, mimeType);
      console.log('3. S3 백업 성공:', jobId, cdnUrl);
    } catch (err) {
      console.error('3. S3 백업 에러:', err);
    }

    /* 4. 상태 DONE 기록 (cdn) */
    try {
      console.log('4. DB 상태 업데이트 시작:', jobId, cdnUrl);
      await this.db.markDone(jobId, cdnUrl);
    } catch (err) {
      console.error('4. DB 상태 업데이트 에러:', err);
    }
  }
}
