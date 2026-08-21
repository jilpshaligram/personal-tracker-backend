import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from '@/modules/transactions/transaction.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  createTransactionSchema,
  CreateTransactionDto,
} from '@/modules/transactions/dto/create-transaction.dto';
import {
  updateTransactionSchema,
  UpdateTransactionDto,
} from '@/modules/transactions/dto/update-transaction.dto';

import { Query } from '@nestjs/common';
import { QueryTransactionDto } from '@/modules/transactions/dto/query-transaction.dto';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(AuthGuard)
@Roles(UserRole.USER)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Transaction',
    description: 'Creates an income, expense, or transfer transaction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async create(
    @Req() req: AuthenticatedRequest,
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
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryTransactionDto,
  ) {
    const userId = req.user.sub;
    const transactions = await this.transactionService.findAll(userId, query);

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
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const transaction = await this.transactionService.findOne(id, userId);

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Transaction',
    description:
      'Updates a transaction by ID and recalculates wallet balances securely.',
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateTransactionSchema))
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const userId = req.user.sub;
    const transaction = await this.transactionService.update(
      id,
      userId,
      updateTransactionDto,
    );

    return {
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Transaction',
    description:
      'Deletes a transaction by ID and reverts its financial impact securely.',
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.transactionService.remove(id, userId);
  }
}
