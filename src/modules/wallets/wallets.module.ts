import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WalletController } from '@/modules/wallets/wallet.controller';
import { WalletService } from '@/modules/wallets/wallet.service';
import { Wallet } from '@/modules/wallets/wallet.schema';
@Module({
  imports: [SequelizeModule.forFeature([Wallet])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletsModule {}
