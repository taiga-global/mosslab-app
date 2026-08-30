import { IsIn, IsString } from 'class-validator';
import { GenerateMode } from '../../../type';
export class GenerateDto {
  @IsString() key: string;
  @IsIn(['animated', 'audiolized']) mode: GenerateMode;
}
