import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';

export const payBillSchema = z.object({
  amountPaid: z.number().positive('Amount paid must be greater than 0'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  remarks: z.string().optional(),
  createTransaction: z.boolean().optional().default(true),
});

export class PayBillDto {
  @ApiProperty({ example: 1500, description: 'Paid amount' })
  amountPaid: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.UPI,
    description: 'Payment method used',
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: 'Paid via bank app',
    description: 'Payment notes',
  })
  notes?: string;

  @ApiPropertyOptional({
    example: 'Paid via bank app',
    description: 'Payment remarks',
  })
  remarks?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Create corresponding transaction entry',
  })
  createTransaction?: boolean;
}
