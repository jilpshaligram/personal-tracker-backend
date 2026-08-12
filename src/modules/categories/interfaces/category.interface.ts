import { CategoryTransactionType } from '../enums/category-transaction-type.enum';

/**
 * @interface ICategory
 *
 * @description
 * Full definition of a Category within the Category Module.
 *
 * WHY IS THIS DIFFERENT FROM TRANSACTION MODULE'S ICATEGORY?
 * The Transaction Module has a minimal interface representing only the fields
 * it needs after a JOIN. This interface represents the full business entity,
 * including timestamps and other module-specific details.
 *
 * WHY IS CREATED_BY BETTER THAN USER_ID?
 * 1. "created_by" implies ownership but supports NULL for system defaults.
 * 2. "user_id" often implies strict association, making system defaults confusing.
 * 3. It aligns perfectly with the "System Default + User Custom" design.
 *
 * WHY IS_DEFAULT IS NEEDED?
 * It provides an explicit flag to differentiate between global system categories
 * and custom user categories, allowing the UI and Business Logic to easily lock
 * down edits or deletes for system categories.
 *
 * SCALABILITY:
 * By separating defaults from custom categories, we can deploy new defaults globally
 * to all users instantly just by adding a new row with is_default = TRUE.
 */
export interface ICategory {
  readonly id: string;
  readonly name: string;
  readonly type: CategoryTransactionType;
  readonly created_by: string | null;
  readonly is_default: boolean;
  readonly is_active: boolean;

  // Sequelize Timestamps
  readonly created_at?: Date;
  readonly updated_at?: Date;
  readonly deleted_at?: Date | null;
}
