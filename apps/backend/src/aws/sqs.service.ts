import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsService {
  private sqs = new SQSClient({ region: process.env.AWS_REGION });
  private queueUrl = process.env.AWS_SQS_URL;

  sendJob(payload: unknown) {
    return this.sqs.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
      }),
    );
  }
}
