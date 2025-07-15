import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConvertModule } from './convert/convert.module';
import { S3Service } from './aws/s3/s3.service';
import { JobModule } from './job/job.module';

@Module({
  imports: [ConvertModule, JobModule],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
