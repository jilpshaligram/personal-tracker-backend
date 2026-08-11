import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  createTransactionSchema,
  CreateTransactionDto,
} from '../dto/create-transaction.dto';
import { Request } from 'express';
import { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(
    @Req() req: Request & { user: IJwtPayload },
    @Body(new ZodValidationPipe(createTransactionSchema))
    createTransactionDto: CreateTransactionDto,
  ) {
    const userId = req.user.sub;
    const transaction = await this.transactionService.create(
      userId,
      createTransactionDto,
    );

    return {
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    };
  }

  @Get()
  async findAll(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;
    // Strict isolation: User A cannot see User B's transactions because
    // findAllByUserId uses where: { userId } natively in the repository.
    const transactions = await this.transactionService.findAll(userId);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: IJwtPayload },
  ) {
    const userId = req.user.sub;
    // Strict isolation: findOneByIdAndUserId uses where: { id, userId } natively
    const transaction = await this.transactionService.findOne(id, userId);

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }
}
