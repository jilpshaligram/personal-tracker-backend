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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SavingGoalService } from '../services/saving-goal.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { AuthGuard } from '../../../common/guards/auth.guard';
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

export class SavingGoalDepositDto {
  @ApiProperty({ example: 100, description: 'Amount' })
  amount: number;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Wallet UUID' })
  wallet_id: string;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER, description: 'Payment method' })
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({ example: 'Goal deposit', description: 'Optional note' })
  note?: string;

  @ApiPropertyOptional({ example: '2026-08-12', description: 'Transaction date (YYYY-MM-DD)' })
  transaction_date?: string;
}

@ApiTags('Saving Goals')
@ApiBearerAuth()
@Controller('saving-goals')
export class SavingGoalController {
  constructor(
    private readonly savingGoalService: SavingGoalService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Saving Goal', description: 'Creates a new saving target goal.' })
  @ApiResponse({ status: 201, description: 'Saving goal created successfully.' })
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
  @ApiOperation({ summary: 'Get All Saving Goals', description: 'Retrieves all saving goals for the user.' })
  @ApiResponse({ status: 200, description: 'Saving goals retrieved successfully.' })
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const goals = await this.savingGoalService.findAll(userId);
    return successResponse('Saving goals fetched successfully.', { goals });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Saving Goal by ID', description: 'Retrieves details for a specific saving goal.' })
  @ApiParam({ name: 'id', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 200, description: 'Saving goal retrieved successfully.' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.findOne(id, userId);
    return successResponse('Saving goal fetched successfully.', { goal });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Saving Goal', description: 'Updates details of a saving goal.' })
  @ApiParam({ name: 'id', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 200, description: 'Saving goal updated successfully.' })
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
  @ApiOperation({ summary: 'Delete Saving Goal', description: 'Deletes a saving goal.' })
  @ApiParam({ name: 'id', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 200, description: 'Saving goal deleted successfully.' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.savingGoalService.remove(id, userId);
    return successResponse('Saving goal deleted successfully.');
  }

  @Post(':id/deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deposit into Saving Goal', description: 'Transfers funds from wallet into saving goal.' })
  @ApiParam({ name: 'id', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 201, description: 'Deposit successful.' })
  async deposit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transactionSchema))
    dto: SavingGoalDepositDto,
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
  @ApiOperation({ summary: 'Withdraw from Saving Goal', description: 'Transfers funds from saving goal back to wallet.' })
  @ApiParam({ name: 'id', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 201, description: 'Withdrawal successful.' })
  async withdraw(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transactionSchema))
    dto: SavingGoalDepositDto,
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
