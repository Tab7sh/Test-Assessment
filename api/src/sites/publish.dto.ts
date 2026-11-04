import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PublishDto {
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  address: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  authorId: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(1)
  html: string;
}

