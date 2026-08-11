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
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { Request } from 'express';
import { SavingGoalService } from '../services/saving-goal.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import {
  createSavingGoalSchema,
  CreateSavingGoalDto,
} from '../dto/create-saving-goal.dto';
import {
  updateSavingGoalSchema,
  UpdateSavingGoalDto,
} from '../dto/update-saving-goal.dto';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import { PaymentMethod } from '../../transactions/enums/payment-method.enum';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  wallet_id: z.string().uuid('Invalid wallet ID'),
  payment_method: z
    .nativeEnum(PaymentMethod, {
      message: 'Invalid payment method.',
    })
    .optional(),
  note: z.string().optional(),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
    .optional(),
});

@Controller('saving-goals')
export class SavingGoalController {
  constructor(
    private readonly savingGoalService: SavingGoalService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createSavingGoalSchema))
    dto: CreateSavingGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.create(userId, dto);
    return successResponse('Saving goal created successfully.', { goal });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const goals = await this.savingGoalService.findAll(userId);
    return successResponse('Saving goals fetched successfully.', { goals });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.findOne(id, userId);
    return successResponse('Saving goal fetched successfully.', { goal });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSavingGoalSchema))
    dto: UpdateSavingGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.update(id, userId, dto);
    return successResponse('Saving goal updated successfully.', { goal });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.savingGoalService.remove(id, userId);
    return successResponse('Saving goal deleted successfully.');
  }

  @Post(':id/deposit')
  @HttpCode(HttpStatus.CREATED)
  async deposit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transactionSchema))
    dto: z.infer<typeof transactionSchema>,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const transaction = await this.transactionService.create(userId, {
      ...dto,
      saving_goal_id: id,
      type: TransactionType.TRANSFER_TO_SAVING,
      transaction_date:
        dto.transaction_date || new Date().toISOString().split('T')[0],
      category_id: null,
    });
    return successResponse('Deposit successful.', { transaction });
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.CREATED)
  async withdraw(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transactionSchema))
    dto: z.infer<typeof transactionSchema>,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const transaction = await this.transactionService.create(userId, {
      ...dto,
      saving_goal_id: id,
      type: TransactionType.TRANSFER_FROM_SAVING,
      transaction_date:
        dto.transaction_date || new Date().toISOString().split('T')[0],
      category_id: null,
    });
    return successResponse('Withdrawal successful.', { transaction });
  }
}
