import { CategoryType } from '../enums/category-type.enum';

/**
 * @interface ICategory
 *
 * @description
 * A minimal contract representing only the category fields that the
 * Transaction Module needs to operate.
 *
 * WHY THIS EXISTS HERE (NOT IN CATEGORY MODULE):
 * The Transaction Module must validate category ownership, check if a category
 * is active, and derive transaction type (INCOME/EXPENSE) from the category.
 *
 * However, importing the full Category Module here would create a tight coupling
 * or worse — a circular dependency.
 *
 * This interface is a DEPENDENCY INVERSION boundary.
 */
export interface ICategory {
  /** UUID primary key of the category */
  readonly id: string;

  /** Human-readable display name */
  readonly name: string;

  /**
   * Whether this category classifies money in (INCOME) or money out (EXPENSE).
   * This is the field that determines transaction type.
   */
  readonly type: CategoryType;

  /**
   * Whether this is a system default category (visible to all users).
   * Needed by the Transaction Module to validate if a user can use it.
   */
  readonly is_default: boolean;

  /**
   * The owner of the category. NULL if it is a system default.
   * Needed by the Transaction Module to validate if a user can use it.
   */
  readonly created_by: string | null;

  /**
   * Whether this category is available for new transactions.
   * Inactive categories MUST be rejected at the Service layer.
   */
  readonly is_active: boolean;
}
