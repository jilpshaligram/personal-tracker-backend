import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CategoryTransactionType } from '../enums/category-transaction-type.enum';
import { ICategory } from '../interfaces/category.interface';
// Assuming User entity exists globally, but for now we define the column manually without ForeignKey if it causes circular issues,
// or we can just define the column type directly since Sequelize doesn't strictly require @ForeignKey for simple queries if manually joined,
// but for Sequelize magic it's better. We will just define the column natively.

/**
 * @model Category
 *
 * @description
 * The canonical Entity representing the Categories table.
 * Supports BOTH System Default categories and User Custom categories.
 *
 * SCHEMA DESIGN:
 * - isDefault: TRUE = System Default (visible to everyone). FALSE = User Custom.
 * - createdBy: NULL for system defaults. UUID of the user for custom categories.
 *
 * NORMALIZATION (Transaction Dependency):
 * Transactions do NOT store INCOME/EXPENSE. They store `categoryId`.
 * The application determines a transaction's type by looking at this model's `type` field.
 *
 * WHY NO @HasMany(() => Transaction)?
 * Defining a HasMany relationship here forces the Category Module to import the
 * Transaction Module. This creates a circular dependency (Transaction imports Category,
 * Category imports Transaction). NestJS / Sequelize will fail to load.
 * Keeping associations one-way (Transaction @BelongsTo Category) prevents this entirely.
 */
@Table({
  tableName: 'categories',
  paranoid: true, // Enables soft deletes (deleted_at)
  timestamps: true,
  underscored: true,
})
export class Category
  extends Model<ICategory, Partial<ICategory>>
  implements ICategory
{
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(CategoryTransactionType)),
    allowNull: false,
  })
  declare type: CategoryTransactionType;

  /**
   * NULL for system default categories.
   * UUID for user custom categories.
   */
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_default: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;
}
