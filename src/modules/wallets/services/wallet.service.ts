import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WalletRepository } from '../repositories/wallet.repository';
import { CreateWalletDto } from '../dto/create-wallet.dto';
import { UpdateWalletDto } from '../dto/update-wallet.dto';
import { Wallet } from '../schemas/wallet.schema';

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
  constructor(private readonly walletRepository: WalletRepository) {}

  async create(
    userId: string,
    createWalletDto: CreateWalletDto,
  ): Promise<Wallet> {
    // 1. Check if user already has a wallet
    const existingWallet = await this.walletRepository.findByUserId(userId);
    if (existingWallet) {
      throw new ConflictException('User already has a primary wallet.');
    }

    // 2. Create the wallet
    return this.walletRepository.create(userId, createWalletDto);
  }

  async getWallet(userId: string): Promise<WalletResponse> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user.');
    }

    // Calculate available balance dynamically
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
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user.');
    }

    const [updatedCount, updatedWallets] = await this.walletRepository.update(
      wallet.id,
      updateWalletDto,
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
}
