import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WalletController } from './controllers/wallet.controller';
import { WalletService } from './services/wallet.service';
import { WalletRepository } from './repositories/wallet.repository';
import { Wallet } from './schemas/wallet.schema';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [SequelizeModule.forFeature([Wallet]), SecurityModule],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletService, WalletRepository],
})
export class WalletsModule {}
