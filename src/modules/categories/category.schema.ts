import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';
import { ICategory } from '@/modules/categories/interfaces/category.interface';

@Table({
  tableName: 'categories',
  paranoid: true,
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

  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_default: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean;
}
