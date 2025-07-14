import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConvertModule } from './convert/convert.module';

@Module({
  imports: [ConvertModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
