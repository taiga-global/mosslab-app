import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '../aws/dynamodb.service';
import { SqsService } from '../aws/sqs.service';
import { ConvertDto } from './dto/convert.dto';

@Injectable()
export class ConvertService {
  constructor(
    private readonly sqsService: SqsService,
    private readonly dynamoDBService: DynamoDBService,
  ) {}

  async enqueueJob({ key }: ConvertDto) {
    const jobId = `job-${Date.now()}`; // 고유 jobId 생성

    // SQS에 메시지 전송
    await this.sqsService.sendMessage({ jobId, key });

    // DynamoDB에 PENDING 저장
    await this.dynamoDBService.putItem({
      jobId,
      status: 'PENDING',
      s3Key: key,
      createdAt: new Date().toISOString(),
    });

    return { jobId };
  }
}
