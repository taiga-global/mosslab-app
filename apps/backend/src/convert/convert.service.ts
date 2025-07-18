// import { Injectable } from '@nestjs/common';
// import { CreateConvertDto } from './dto/create-convert.dto';
// import { UpdateConvertDto } from './dto/update-convert.dto';

// @Injectable()
// export class ConvertService {
//   create(createConvertDto: CreateConvertDto) {
//     return 'This action adds a new convert';
//   }

//   findAll() {
//     return `This action returns all convert`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} convert`;
//   }

//   update(id: number, updateConvertDto: UpdateConvertDto) {
//     return `This action updates a #${id} convert`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} convert`;
//   }
// }

import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { SqsService } from '../aws/sqs.service';

@Injectable()
export class ConvertService {
  constructor(
    private s3: S3Service,
    private sqs: SqsService,
    private db: DynamoDbService,
  ) {}

  // getPresignedUpload({ filename, mime }: { filename: string; mime: string }) {
  //   // S3 키 생성
  //   const key = `uploads/${uuid()}-${filename}`;
  //   return { putUrl: this.s3.getUploadUrl(key, mime), key };
  // }
  async getPresignedUpload({
    filename,
    mime,
  }: {
    filename: string;
    mime: string;
  }) {
    const key = `uploads/${uuid()}-${filename}`;
    try {
      const putUrl = await this.s3.getUploadUrl(key, mime);
      return { putUrl, key };
    } catch (e) {
      console.error('S3 Presigned URL 생성 실패:', e);
      throw e;
    }
  }

  async requestConvert(key: string) {
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
