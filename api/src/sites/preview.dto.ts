import { IsString, MaxLength } from 'class-validator';

export class PreviewDto {
  @IsString()
  @MaxLength(200_000)
  html: string;
}
