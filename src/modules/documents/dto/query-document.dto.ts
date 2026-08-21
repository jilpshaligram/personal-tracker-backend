import { IsDateString, IsInt, IsOptional, IsUUID } from 'class-validator';
import { QueryDto } from '@/common/dto/query.dto';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDocumentDto extends QueryDto {
  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: '2028-12-31',
    description: 'Filter by expiry date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Filter by reminder days before expiry',
  })
  @IsOptional()
  @Type((): NumberConstructor => Number)
  @IsInt()
  reminderDaysBefore?: number;
}
