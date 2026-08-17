import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WalletService } from '../services/wallet.service';
import { createWalletSchema, CreateWalletDto } from '../dto/create-wallet.dto';
import { updateWalletSchema, UpdateWalletDto } from '../dto/update-wallet.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Request } from 'express';
import { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Wallets')
@ApiBearerAuth()
@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Wallet',
    description: 'Creates a wallet for the authenticated user.',
  })
  @ApiResponse({ status: 201, description: 'Wallet created successfully.' })
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
  @ApiOperation({
    summary: 'Get My Wallet',
    description: "Retrieves the authenticated user's wallet.",
  })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully.' })
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
  @ApiOperation({
    summary: 'Update My Wallet',
    description: "Updates the authenticated user's wallet currency.",
  })
  @ApiResponse({ status: 200, description: 'Wallet updated successfully.' })
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
