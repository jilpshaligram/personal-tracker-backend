import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { SavingTransactionType } from '@/modules/saving-transactions/enums/saving-transaction-type.enum';

@Table({
  tableName: 'saving_transactions',
  paranoid: true,
  timestamps: true,
  underscored: false,
})
export class SavingTransaction extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare savingGoalId: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @Column({
    type: DataType.ENUM(...Object.values(SavingTransactionType)),
    allowNull: false,
  })
  declare type: SavingTransactionType;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  declare amount: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;
}
