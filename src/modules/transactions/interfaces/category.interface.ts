import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';

export interface ICategory {
  readonly id: string;

  readonly name: string;

  readonly type: CategoryTransactionType;

  readonly is_default: boolean;

  readonly created_by: string | null;

  readonly is_active: boolean;
}
