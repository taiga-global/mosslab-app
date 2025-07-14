import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SqsService {
  private client = new SQSClient({ region: 'ap-northeast-2' });
  private queueUrl = process.env.SQS_QUEUE_URL;

  async sendMessage(body: { jobId: string; key: string }) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(body),
    });
    await this.client.send(command);
  }
}
