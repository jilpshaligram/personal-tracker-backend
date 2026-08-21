import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Wallet } from '@/modules/wallets/wallet.schema';
import { CreateWalletDto } from '@/modules/wallets/dto/create-wallet.dto';
import { UpdateWalletDto } from '@/modules/wallets/dto/update-wallet.dto';
import { IWallet } from '@/modules/wallets/interfaces/wallet.interface';
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
    data: UpdateWalletDto | Partial<IWallet>,
    transaction?: Transaction,
  ): Promise<[number, Wallet[]]> {
    return this.walletModel.update(data, {
      where: { id: walletId },
      returning: true,
      transaction,
    });
  }
}
