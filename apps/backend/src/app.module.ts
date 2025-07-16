// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ConvertModule } from './convert/convert.module';

// @Module({
//   imports: [ConvertModule],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoDbService } from './aws/dynamodb.service';
import { S3Service } from './aws/s3.service';
import { SqsService } from './aws/sqs.service';
import { ConvertModule } from './convert/convert.module';
import { JobProcessor } from './job/job.processor';
import { ReplicateService } from './replicate/replicate.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ConvertModule],
  providers: [
    JobProcessor,
    S3Service,
    SqsService,
    DynamoDbService,
    ReplicateService,
  ],
})
export class AppModule {}
