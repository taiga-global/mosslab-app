import { PartialType } from '@nestjs/mapped-types';
import { CreateGeneratetDto } from './create-generate.dto';

export class UpdateGenerateDto extends PartialType(CreateGeneratetDto) {}
