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

import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoDbService } from './aws/dynamodb.service';
import { S3Service } from './aws/s3.service';
import { SqsService } from './aws/sqs.service';
import { BackupService } from './backup/backup.service';
import { GenerateModule } from './generate/generate.module';
import { JobProcessor } from './job/job.processor';
import { AppLoggerMiddleware } from './middleware/app-logger.middleware';
import { OpenAiService } from './openai/openai.service';
import { ReplicateService } from './replicate/replicate.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GenerateModule],
  providers: [
    JobProcessor,
    S3Service,
    SqsService,
    DynamoDbService,
    ReplicateService,
    OpenAiService,
    BackupService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
