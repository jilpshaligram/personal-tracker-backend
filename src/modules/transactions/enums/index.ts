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
 * import { PaymentMethod, CategoryType } from '../enums';
 * instead of:
 * import { PaymentMethod } from '../enums/payment-method.enum';
 * import { CategoryType } from '../enums/category-type.enum';
 */
export { CategoryType } from './category-type.enum';
export { PaymentMethod } from './payment-method.enum';
