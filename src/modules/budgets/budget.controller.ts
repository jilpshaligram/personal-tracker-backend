import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
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
import { BudgetService } from '@/modules/budgets/budget.service';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { successResponse } from '@/common/responses/api-response.helper';
import {
  createBudgetSchema,
  CreateBudgetDto,
} from '@/modules/budgets/dto/create-budget.dto';
import {
  updateBudgetSchema,
  UpdateBudgetDto,
} from '@/modules/budgets/dto/update-budget.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';
import { BudgetAlertJob } from '@/jobs/budget-alert.job';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Budgets')
@ApiBearerAuth('access-token')
@Controller('budgets')
@UseGuards(AuthGuard)
@Roles(UserRole.USER)
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly budgetAlertJob: BudgetAlertJob,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create budget',
    description: 'Creates a new budget target.',
  })
  @ApiResponse({ status: 201, description: 'Budget created successfully.' })
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
  @ApiOperation({
    summary: 'Get all budgets',
    description: 'Retrieves all budgets for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Budgets fetched successfully.' })
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const budgets = await this.budgetService.findAll(userId);
    return successResponse('Budgets fetched successfully.', { budgets });
  }

  @Get('dashboard-overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard budget overview',
    description:
      'Retrieves the latest budget overview including spent and remaining amounts for all periods.',
  })
  @ApiResponse({
    status: 200,
    description: 'Budget overview fetched successfully.',
  })
  async getDashboardOverview(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const data = await this.budgetService.getDashboardOverview(userId);
    return successResponse('Budget overview fetched successfully', data);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get budget by ID',
    description: 'Retrieves details for a specific budget.',
  })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: 200, description: 'Budget fetched successfully.' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const budget = await this.budgetService.findOne(id, userId);
    return successResponse('Budget fetched successfully.', { budget });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update budget',
    description: 'Updates details of an existing budget.',
  })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully.' })
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
  @ApiOperation({ summary: 'Delete budget', description: 'Deletes a budget.' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully.' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.budgetService.remove(id, userId);
    return successResponse('Budget deleted successfully.');
  }

  @Post('test-alerts')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEV] Manually trigger the budget alert scheduler',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduler triggered successfully.',
  })
  async testAlerts() {
    await this.budgetAlertJob.triggerNow();
    return successResponse('Budget alert check triggered. Check server logs.');
  }
}
