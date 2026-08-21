import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import { User } from '@/modules/users/user.schema';
import { IWallet } from '@/modules/wallets/interfaces/wallet.interface';

@Table({
  tableName: 'wallets',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Wallet
  extends Model<IWallet, Partial<IWallet>>
  implements IWallet
{
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: 'user_id' })
  declare userId: string;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    field: 'current_balance',
    get() {
      const value = this.getDataValue('currentBalance') as
        string | number | null;
      if (value === null) return null;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  declare currentBalance: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    field: 'blocked_amount',
    get() {
      const value = this.getDataValue('blockedAmount') as
        string | number | null;
      if (value === null) return null;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  declare blockedAmount: number;

  @AllowNull(false)
  @Default('INR')
  @Column(DataType.STRING(3))
  declare currency: string;

  @BelongsTo(() => User)
  declare user: User;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}
