import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { QueryDto } from '../../../common/dto/query.dto';
import { SavingTransactionType } from '../enums/saving-transaction-type.enum';

export class QuerySavingTransactionDto extends QueryDto {
  @ApiPropertyOptional({ enum: SavingTransactionType, description: 'Filter by transaction type' })
  @IsOptional()
  @IsEnum(SavingTransactionType)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  type?: SavingTransactionType;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Saving Goal UUID' })
  @IsOptional()
  @IsUUID()
  savingGoalId?: string;

  @ApiPropertyOptional({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'User UUID' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
