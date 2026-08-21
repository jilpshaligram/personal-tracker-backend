import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BudgetPeriod } from '@/modules/budgets/enums/budget-period.enum';
import { IBudget } from '@/modules/budgets/interfaces/budget.interface';

@Table({
  tableName: 'budgets',
  paranoid: true,
  timestamps: true,
  underscored: true,
})
export class Budget
  extends Model<IBudget, Partial<IBudget>>
  implements IBudget
{
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  declare amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(BudgetPeriod)),
    allowNull: false,
  })
  declare period: BudgetPeriod;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare endDate: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true, allowNull: false })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;
}
