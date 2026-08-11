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
} from '@nestjs/common';
import type { Request } from 'express';
import { BudgetService } from '../services/budget.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { createBudgetSchema, CreateBudgetDto } from '../dto/create-budget.dto';
import { updateBudgetSchema, UpdateBudgetDto } from '../dto/update-budget.dto';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createBudgetSchema))
    dto: CreateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const budget = await this.budgetService.create(userId, dto);
    return successResponse('Budget created successfully.', { budget });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const budgets = await this.budgetService.findAll(userId);
    return successResponse('Budgets fetched successfully.', { budgets });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const budget = await this.budgetService.findOne(id, userId);
    return successResponse('Budget fetched successfully.', { budget });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBudgetSchema))
    dto: UpdateBudgetDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const budget = await this.budgetService.update(id, userId, dto);
    return successResponse('Budget updated successfully.', { budget });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.budgetService.remove(id, userId);
    return successResponse('Budget deleted successfully.');
  }
}
