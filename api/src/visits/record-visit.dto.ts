import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';
import { VIA, Via } from './visit.schema';

export class RecordVisitDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;

  @IsString()
  @MaxLength(64)
  personId: string;

  @IsString()
  @MaxLength(80)
  address: string;

  /** The revision the browser displayed; omitted/null for "whatever is current" or nowhere. */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  @Min(1)
  revision?: number | null;

  @IsIn(VIA as unknown as string[])
  via: Via;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  @MaxLength(300)
  from?: string | null;
}

