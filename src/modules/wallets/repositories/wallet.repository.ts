import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Wallet } from '../schemas/wallet.schema';
import { CreateWalletDto } from '../dto/create-wallet.dto';
import { UpdateWalletDto } from '../dto/update-wallet.dto';
import { Transaction } from 'sequelize';

@Injectable()
export class WalletRepository {
  constructor(
    @InjectModel(Wallet)
    private readonly walletModel: typeof Wallet,
  ) {}

  async create(
    userId: string,
    data: CreateWalletDto,
    transaction?: Transaction,
  ): Promise<Wallet> {
    return this.walletModel.create(
      {
        userId,
        currency: data.currency,
        currentBalance: 0,
        blockedAmount: 0,
      },
      { transaction },
    );
  }

  async findByUserId(
    userId: string,
    transaction?: Transaction,
  ): Promise<Wallet | null> {
    return this.walletModel.findOne({
      where: { userId },
      transaction,
    });
  }

  /**
   * Retrieves the wallet with a row-level lock for safe financial operations.
   * MUST be used inside a Sequelize Transaction.
   */
  async findByUserIdForUpdate(
    userId: string,
    transaction: Transaction,
  ): Promise<Wallet | null> {
    return this.walletModel.findOne({
      where: { userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  async update(
    walletId: string,
    data: UpdateWalletDto,
    transaction?: Transaction,
  ): Promise<[number, Wallet[]]> {
    return this.walletModel.update(data, {
      where: { id: walletId },
      returning: true,
      transaction,
    });
  }
}
