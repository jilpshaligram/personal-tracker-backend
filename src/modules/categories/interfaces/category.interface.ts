import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';

export interface ICategory {
  readonly id: string;
  readonly name: string;
  readonly type: CategoryTransactionType;
  readonly created_by: string | null;
  readonly is_default: boolean;
  readonly is_active: boolean;
  readonly created_at?: Date;
  readonly updated_at?: Date;
  readonly deleted_at?: Date | null;
}
