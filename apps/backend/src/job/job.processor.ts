import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobMessage } from 'type';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
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
        console.error('Message가 없습니다:', Messages);
        return;
      } else {
        console.log('Message: ', Messages);
      }

      for (const m of Messages) {
        const { jobId, key } = JSON.parse(m.Body ?? '') as JobMessage;
        if (!key) {
          console.error('SQS 메시지에 key가 없습니다:', m.Body);
          continue;
        }
        try {
          // 1) S3 원본 다운로드 URL
          console.log('1. S3 원본 다운로드 URL 생성 시작:', key);
          const srcUrl = await this.s3.getDownloadUrl(key);
          console.log('1. S3 원본 다운로드 URL 생성 성공:', srcUrl);

          // 2) Replicate 호출 (예시)
          let gifBuffer;
          try {
            console.log('2. Replicate 변환 시작:', srcUrl);
            gifBuffer = await this.replicate.makeGif(srcUrl);
            console.log('2. Replicate 변환 성공');
          } catch (err) {
            console.error('2. Replicate 변환 에러:', err);
            // 실패 시
            await this.db.markFailed(
              jobId,
              'Replicate 변환 에러: ' + String(err),
            );
            continue; // 다음 메시지로 넘어감
          }

          // 3) 결과 업로드
          const outKey = `results/${jobId}.gif`;
          try {
            console.log('3. S3 결과 업로드 시작:', outKey);
            await this.s3.uploadImage(
              Buffer.from(gifBuffer),
              'image/gif',
              outKey,
            );
            console.log('3. S3 결과 업로드 성공:', outKey);
          } catch (err) {
            console.error('3. S3 결과 업로드 에러:', err);
            continue;
          }

          // 4) 상태 업데이트
          try {
            console.log('4. DB 상태 업데이트 시작:', jobId, outKey);
            await this.db.markDone(jobId, outKey);
            console.log('4. DB 상태 업데이트 성공:', jobId, outKey);
          } catch (err) {
            console.error('4. DB 상태 업데이트 에러:', err);
            continue;
          }
        } finally {
          // 5) 큐 삭제
          try {
            console.log('5. SQS 메시지 삭제 시작');
            await this.sqs.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: m.ReceiptHandle,
              }),
            );
            console.log('5. SQS 메시지 삭제 성공');
          } catch (err) {
            console.error('5. SQS 메시지 삭제 에러:', err);
          }
        }
      }
    } finally {
      this.isPolling = false;
    }
  }
}
