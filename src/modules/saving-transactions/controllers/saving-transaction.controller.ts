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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SavingTransactionService } from '../services/saving-transaction.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { AuthGuard } from '../../../common/guards/auth.guard';
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

@ApiTags('Saving Transactions')
@ApiBearerAuth()
@Controller()
export class SavingTransactionController {
  constructor(
    private readonly savingTransactionService: SavingTransactionService,
  ) { }

  @Post('saving-goals/:goalId/transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record Saving Goal Transaction', description: 'Records a contribution or withdrawal for a specific saving goal.' })
  @ApiParam({ name: 'goalId', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 201, description: 'Transaction recorded successfully.' })
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

  @Get('saving-goals/:goalId/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Saving Goal Transactions', description: 'Retrieves all transactions for a specific saving goal.' })
  @ApiParam({ name: 'goalId', description: 'Saving Goal UUID' })
  @ApiResponse({ status: 200, description: 'Transactions fetched successfully.' })
  async findAllByGoal(
    @Param('goalId') goalId: string,
    @Query() query: QuerySavingTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const result = await this.savingTransactionService.findAllByGoal(
      goalId,
      userId,
      query,
    );
    return successResponse('Transactions fetched successfully.', {
      result,
    });
  }

  @Get('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Saving Transaction by ID', description: 'Retrieves a single saving transaction by ID.' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Transaction fetched successfully.' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const transaction = await this.savingTransactionService.findOne(id, userId);
    return successResponse('Transaction fetched successfully.', {
      transaction,
    });
  }

  @Patch('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Saving Transaction', description: 'Updates a saving transaction and recalculates goal totals.' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully.' })
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

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Saving Transaction', description: 'Deletes a saving transaction and recalculates goal totals.' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully.' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.savingTransactionService.remove(id, userId);
    return successResponse(
      'Transaction deleted and goal totals recalculated successfully.',
    );
  }
}
