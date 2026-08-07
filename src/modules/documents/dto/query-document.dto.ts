import { IsDateString, IsInt, IsOptional, IsUUID } from 'class-validator';
import { QueryDto } from '../../../common/dto/query.dto';
import { Type } from 'class-transformer';

export class QueryDocumentDto extends QueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @Type((): NumberConstructor => Number)
  @IsInt()
  reminderDaysBefore?: number;
}
