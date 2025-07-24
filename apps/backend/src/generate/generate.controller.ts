import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GenerateDto } from './dto/generate.dto';
import { UploadUrlDto } from './dto/upload-url.dto';
import { GenerateService } from './generate.service';

@Controller()
export class GenerateController {
  constructor(private service: GenerateService) {}

  @Post('upload-url')
  async getUpload(@Body() dto: UploadUrlDto) {
    return await this.service.getPresignedUpload(dto);
  }

  @Post('convert')
  convert(@Body() dto: GenerateDto) {
    return this.service.requestGenerate(dto.key);
  }

  @Get('jobs/:jobId')
  status(@Param('jobId') jobId: string) {
    return this.service.getStatus(jobId);
  }
}
