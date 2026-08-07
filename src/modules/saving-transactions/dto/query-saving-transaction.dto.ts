import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

import { QueryDto } from '../../../common/dto/query.dto';
import { SavingTransactionType } from '../enums/saving-transaction-type.enum';

export class QuerySavingTransactionDto extends QueryDto {
  @IsOptional()
  @IsEnum(SavingTransactionType)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  type?: SavingTransactionType;

  @IsOptional()
  @IsUUID()
  savingGoalId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
