import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  createTransactionSchema,
  CreateTransactionDto,
} from '../dto/create-transaction.dto';
import { Request } from 'express';
import { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Transaction',
    description:
      'Creates an income, expense, opening balance, or transfer transaction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
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
  @ApiOperation({
    summary: 'Get All Transactions',
    description:
      'Retrieves all transactions belonging to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully.',
  })
  async findAll(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;
    const transactions = await this.transactionService.findAll(userId);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Transaction by ID',
    description: 'Retrieves a single transaction by ID.',
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: IJwtPayload },
  ) {
    const userId = req.user.sub;
    const transaction = await this.transactionService.findOne(id, userId);

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }
}
