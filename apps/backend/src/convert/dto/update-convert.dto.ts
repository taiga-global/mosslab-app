import { PartialType } from '@nestjs/mapped-types';
import { CreateConvertDto } from './create-convert.dto';

export class UpdateConvertDto extends PartialType(CreateConvertDto) {}
