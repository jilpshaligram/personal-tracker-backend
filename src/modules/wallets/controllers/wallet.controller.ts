import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WalletService } from '../services/wallet.service';
import { createWalletSchema } from '../dto/create-wallet.dto';
import type { CreateWalletDto } from '../dto/create-wallet.dto';
import { updateWalletSchema } from '../dto/update-wallet.dto';
import type { UpdateWalletDto } from '../dto/update-wallet.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Request } from 'express';
import { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async create(
    @Req() req: Request & { user: IJwtPayload },
    @Body(new ZodValidationPipe(createWalletSchema))
    createWalletDto: CreateWalletDto,
  ) {
    const userId = req.user.sub;
    const wallet = await this.walletService.create(userId, createWalletDto);

    return {
      success: true,
      message: 'Wallet created successfully',
      data: wallet,
    };
  }

  @Get('me')
  async getMyWallet(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;
    const walletData = await this.walletService.getWallet(userId);

    return {
      success: true,
      message: 'Wallet retrieved successfully',
      data: walletData,
    };
  }

  @Patch('me')
  async updateMyWallet(
    @Req() req: Request & { user: IJwtPayload },
    @Body(new ZodValidationPipe(updateWalletSchema))
    updateWalletDto: UpdateWalletDto,
  ) {
    const userId = req.user.sub;
    const walletData = await this.walletService.update(userId, updateWalletDto);

    return {
      success: true,
      message: 'Wallet updated successfully',
      data: walletData,
    };
  }
}
