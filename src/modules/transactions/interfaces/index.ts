/**
 * @barrel Interfaces
 *
 * @description
 * Barrel export for all Transaction Module interfaces.
 *
 * IMPORT ORDER MATTERS HERE:
 * ICategory must be exported before ITransaction because ITransaction
 * imports ICategory. Barrel files must respect import dependency order
 * to avoid TypeScript circular reference warnings.
 *
 * USAGE:
 * import { ITransaction, ITransactionResponse } from '../interfaces';
 */
export type { ICategory } from './category.interface';
export type { ITransactionFilter } from './transaction-filter.interface';
export type {
  ICategoryMeta,
  ITransactionListResponse,
  ITransactionResponse,
} from './transaction-response.interface';
export type { ITransaction } from './transaction.interface';
