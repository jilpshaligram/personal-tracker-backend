import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateWalletDto } from '@/modules/wallets/dto/create-wallet.dto';
import { UpdateWalletDto } from '@/modules/wallets/dto/update-wallet.dto';
import { Wallet } from '@/modules/wallets/wallet.schema';
import { Transaction } from 'sequelize';

export interface WalletResponse {
  id: string;
  currency: string;
  currentBalance: number;
  blockedAmount: number;
  availableBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet)
    private readonly walletModel: typeof Wallet,
  ) {}

  async create(
    userId: string,
    createWalletDto: CreateWalletDto,
  ): Promise<Wallet> {
    const existingWallet = await this.findByUserId(userId);
    if (existingWallet) {
      throw new ConflictException('User already has a primary wallet.');
    }

    return this.walletModel.create({
      userId,
      currency: createWalletDto.currency,
      currentBalance: 0,
      blockedAmount: 0,
    });
  }

  async getWallet(userId: string): Promise<WalletResponse> {
    const wallet = await this.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user.');
    }

    const currentBalance = Number(wallet.currentBalance);
    const blockedAmount = Number(wallet.blockedAmount);
    const availableBalance = Number(
      (currentBalance - blockedAmount).toFixed(2),
    );

    return {
      id: wallet.id,
      currency: wallet.currency,
      currentBalance,
      blockedAmount,
      availableBalance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async update(
    userId: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<WalletResponse> {
    const wallet = await this.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user.');
    }

    const [updatedCount, updatedWallets] = await this.walletModel.update(
      updateWalletDto,
      {
        where: { id: wallet.id },
        returning: true,
      },
    );

    if (updatedCount === 0 || !updatedWallets.length) {
      throw new NotFoundException('Failed to update wallet.');
    }

    const updatedWallet = updatedWallets[0];
    const currentBalance = Number(updatedWallet.currentBalance);
    const blockedAmount = Number(updatedWallet.blockedAmount);
    const availableBalance = Number(
      (currentBalance - blockedAmount).toFixed(2),
    );

    return {
      id: updatedWallet.id,
      currency: updatedWallet.currency,
      currentBalance,
      blockedAmount,
      availableBalance,
      createdAt: updatedWallet.createdAt,
      updatedAt: updatedWallet.updatedAt,
    };
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
}
