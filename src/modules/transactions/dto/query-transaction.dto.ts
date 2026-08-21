import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QueryDto } from '@/common/dto/query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@/modules/transactions/enums/transaction-type.enum';
import { PaymentMethod } from '@/modules/transactions/enums/payment-method.enum';

export class QueryTransactionDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter by transaction type or ALL',
    enum: [...Object.values(TransactionType), 'ALL'],
  })
  @IsOptional()
  type?: TransactionType | 'ALL';

  @ApiPropertyOptional({ description: 'Filter by category name (or use ALL)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
