import { IsString } from 'class-validator';

export class ConvertDto {
  @IsString()
  key: string;
}
