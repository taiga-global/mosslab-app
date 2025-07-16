// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { ConvertService } from './convert.service';
// import { CreateConvertDto } from './dto/create-convert.dto';
// import { UpdateConvertDto } from './dto/update-convert.dto';

// @Controller('convert')
// export class ConvertController {
//   constructor(private readonly convertService: ConvertService) {}

//   @Post()
//   create(@Body() createConvertDto: CreateConvertDto) {
//     return this.convertService.create(createConvertDto);
//   }

//   @Get()
//   findAll() {
//     return this.convertService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.convertService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateConvertDto: UpdateConvertDto) {
//     return this.convertService.update(+id, updateConvertDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.convertService.remove(+id);
//   }
// }

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { ConvertDto } from './dto/convert.dto';
import { UploadUrlDto } from './dto/upload-url.dto';

@Controller()
export class ConvertController {
  constructor(private service: ConvertService) {}

  @Post('upload-url')
  getUpload(@Body() dto: UploadUrlDto) {
    return this.service.getPresignedUpload(dto);
  }

  @Post('convert')
  convert(@Body() dto: ConvertDto) {
    return this.service.requestConvert(dto.key);
  }

  @Get('jobs/:jobId')
  status(@Param('jobId') jobId: string) {
    return this.service.getStatus(jobId);
  }
}
