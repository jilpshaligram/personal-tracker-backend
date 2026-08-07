import { z } from 'zod';
import { PaymentMethod } from '../enums/payment-method.enum';

export const payBillSchema = z.object({
  amountPaid: z.number().positive('Amount paid must be greater than 0'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  remarks: z.string().optional(),
  createTransaction: z.boolean().default(false),
});

export type PayBillDto = z.infer<typeof payBillSchema>;
