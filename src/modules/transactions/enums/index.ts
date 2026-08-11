/**
 * @barrel Enums
 *
 * @description
 * Barrel export for all Transaction Module enums.
 *
 * WHY A BARREL FILE:
 * Allows any file inside or outside this module to import multiple enums
 * from a single path instead of multiple import statements.
 *
 * USAGE:
 * import { PaymentMethod, TransactionType } from '../enums';
 * instead of:
 * import { PaymentMethod } from '../enums/payment-method.enum';
 * import { TransactionType } from '../enums/transaction-type.enum';
 */
export { TransactionType } from './transaction-type.enum';
export { PaymentMethod } from './payment-method.enum';
