import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { GenerateMode } from '../../type';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';

interface GetPresignedUploadParams {
  filename: string;
  mime: string;
}

@Injectable()
export class GenerateService {
  constructor(
    private s3: S3Service,
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

  async requestGenerate(key: string, mode: GenerateMode) {
    const jobId = uuid();
    await this.db.createPendingWithOutbox(jobId, key, mode);
    return { jobId };
  }

  async getDownloadUrl(jobId: string) {
    const job = (await this.db.get(jobId)) as {
      status: string;
      outputKey?: string;
      errorMessage?: string;
    } | null;
    if (!job) throw new NotFoundException('Job not found');
    const downloadUrl =
      job.status === 'DONE' && job.outputKey
        ? await this.s3.getDownloadUrl(job.outputKey)
        : '';
    return { status: job.status, downloadUrl, errorMessage: job.errorMessage };
  }
}
