import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WalletService } from '../services/wallet.service';
import { createWalletSchema, CreateWalletDto } from '../dto/create-wallet.dto';
import { updateWalletSchema, UpdateWalletDto } from '../dto/update-wallet.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';

@ApiTags('Wallets')
@ApiBearerAuth('access-token')
@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create primary wallet',
    description:
      'Creates a primary wallet with initial zero balance for the authenticated user.',
  })
  @ApiBody({ type: CreateWalletDto })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (e.g. invalid currency code).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token.',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has a primary wallet.',
  })
  async create(
    @Req() req: AuthenticatedRequest,
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my wallet',
    description:
      "Retrieves the authenticated user's wallet including current balance, blocked amount, and calculated available balance.",
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found for this user.',
  })
  async getMyWallet(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const walletData = await this.walletService.getWallet(userId);

    return {
      success: true,
      message: 'Wallet retrieved successfully',
      data: walletData,
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update my wallet',
    description:
      "Updates details of the authenticated user's wallet (e.g. currency).",
  })
  @ApiBody({ type: UpdateWalletDto })
  @ApiResponse({
    status: 200,
    description: 'Wallet updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found for this user.',
  })
  async updateMyWallet(
    @Req() req: AuthenticatedRequest,
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
