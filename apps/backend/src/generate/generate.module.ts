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
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';

@Module({
  controllers: [GenerateController],
  providers: [GenerateService, S3Service, DynamoDbService],
})
export class GenerateModule {}
