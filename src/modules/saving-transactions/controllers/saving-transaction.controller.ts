import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { SavingTransactionService } from '../services/saving-transaction.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import {
  createSavingTransactionSchema,
  CreateSavingTransactionDto,
} from '../dto/create-saving-transaction.dto';
import {
  updateSavingTransactionSchema,
  UpdateSavingTransactionDto,
} from '../dto/update-saving-transaction.dto';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { QuerySavingTransactionDto } from '../dto/query-saving-transaction.dto';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@Controller()
export class SavingTransactionController {
  constructor(
    private readonly savingTransactionService: SavingTransactionService,
  ) {}

  // ─── POST /saving-goals/:goalId/transactions ─────────────────────────────

  @Post('saving-goals/:goalId/transactions')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('goalId') goalId: string,
    @Body(new ZodValidationPipe(createSavingTransactionSchema))
    dto: CreateSavingTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const transaction = await this.savingTransactionService.create(
      goalId,
      userId,
      dto,
    );
    return successResponse('Transaction recorded successfully.', {
      transaction,
    });
  }

  // ─── GET /saving-goals/:goalId/transactions ───────────────────────────────

  @Get('saving-goals/:goalId/transactions')
  @HttpCode(HttpStatus.OK)
  async findAllByGoal(
    @Param('goalId') goalId: string,
    @Query() query: QuerySavingTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    // const transactions = await this.savingTransactionService.findAllByGoal(
    //   goalId,
    //   userId,
    // );
    const result = await this.savingTransactionService.findAllByGoal(
      goalId,
      userId,
      query,
    );
    return successResponse('Transactions fetched successfully.', {
      result,
    });
  }

  // ─── GET /transactions/:id ───────────────────────────────────────────────

  @Get('transactions/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const transaction = await this.savingTransactionService.findOne(id, userId);
    return successResponse('Transaction fetched successfully.', {
      transaction,
    });
  }

  // ─── PATCH /transactions/:id ──────────────────────────────────────────────

  @Patch('transactions/:id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSavingTransactionSchema))
    dto: UpdateSavingTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const transaction = await this.savingTransactionService.update(
      id,
      userId,
      dto,
    );
    return successResponse(
      'Transaction updated and goal totals recalculated successfully.',
      { transaction },
    );
  }

  // ─── DELETE /transactions/:id ────────────────────────────────────────────

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.savingTransactionService.remove(id, userId);
    return successResponse(
      'Transaction deleted and goal totals recalculated successfully.',
    );
  }
}
