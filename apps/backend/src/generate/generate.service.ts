import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { SqsService } from '../aws/sqs.service';

interface GetPresignedUploadParams {
  filename: string;
  mime: string;
}

@Injectable()
export class GenerateService {
  constructor(
    private s3: S3Service,
    private sqs: SqsService,
    private db: DynamoDbService,
  ) {}

  async getPresignedUpload({ filename, mime }: GetPresignedUploadParams) {
    const key = `uploads/${uuid()}-${filename}`;
    try {
      const putUrl = await this.s3.getUploadUrl(key, mime);
      return { putUrl, key };
    } catch (e) {
      console.error('S3 Presigned URL 생성 실패:', e);
      throw e;
    }
  }

  async requestGenerate(key: string) {
    const jobId = uuid();
    await this.sqs.sendJob({ jobId, key });
    await this.db.putPending(jobId, key);
    return { jobId };
  }

  async getStatus(jobId: string) {
    const job = (await this.db.get(jobId)) as {
      status: string;
      outputKey?: string;
    } | null;
    let outputUrl = '';
    let status = 'PENDING'; // 기본값(혹은 null, undefined 등)
    if (job) {
      status = job.status;
      if (job.outputKey && job.status === 'DONE') {
        outputUrl = await this.s3.getDownloadUrl(job.outputKey);
      }
    }
    return {
      status,
      outputUrl,
      // 필요하다면 outputKey 등 추가
    };
  }
}
