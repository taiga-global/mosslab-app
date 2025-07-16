// import { Module } from '@nestjs/common';
// import { ConvertService } from './convert.service';
// import { ConvertController } from './convert.controller';

// @Module({
//   controllers: [ConvertController],
//   providers: [ConvertService],
// })
// export class ConvertModule {}

import { Module } from '@nestjs/common';
import { DynamoDbService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { SqsService } from '../aws/sqs.service';
import { ConvertController } from './convert.controller';
import { ConvertService } from './convert.service';

@Module({
  controllers: [ConvertController],
  providers: [ConvertService, S3Service, SqsService, DynamoDbService],
})
export class ConvertModule {}
