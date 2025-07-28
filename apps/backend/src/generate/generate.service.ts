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

  async requestGenerate(key: string, mode: string) {
    const jobId = uuid();
    await this.sqs.sendJob({ jobId, key, mode });
    await this.db.putPending(jobId, key, mode);
    return { jobId };
  }

  async getDownloadUrl(jobId: string) {
    let downloadUrl = '';
    let status: string;

    do {
      const job = (await this.db.get(jobId)) as {
        status: string;
        downloadUrl?: string;
      } | null;
      console.log('Job 상태:', job);

      status = job?.status ?? 'PENDING';
      if (job?.downloadUrl && status === 'DONE') {
        downloadUrl = job.downloadUrl;
      }

      if (status === 'PENDING') {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초 대기
      }
    } while (status === 'PENDING');

    return { status, downloadUrl };
  }
}
