import { IsString } from 'class-validator';
export class GenerateDto {
  @IsString() key: string;
  @IsString() mode: string;
}
