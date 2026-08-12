import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';

export const payBillSchema = z.object({
  amountPaid: z.number().positive('Amount paid must be greater than 0'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  remarks: z.string().optional(),
  createTransaction: z.boolean().default(false),
});

export class PayBillDto {
  @ApiProperty({ example: 120.5, description: 'Paid amount' })
  amountPaid: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    description: 'Payment method used',
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: 'Paid via mobile banking',
    description: 'Payment remarks',
  })
  remarks?: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Create corresponding transaction entry',
  })
  createTransaction?: boolean;
}
