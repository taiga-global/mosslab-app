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

  getPresignedUpload({ filename, mime }: { filename: string; mime: string }) {
    // S3 키 생성
    const key = `uploads/${uuid()}-${filename}`;
    return { putUrl: this.s3.getUploadUrl(key, mime), key };
  }

  async requestConvert(key: string) {
    const jobId = uuid();
    await this.sqs.sendJob({ jobId, key });
    await this.db.putPending(jobId, key);
    return { jobId };
  }

  getStatus(jobId: string) {
    return this.db.get(jobId);
  }
}
