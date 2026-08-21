import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  getDashboardSchema,
  GetDashboardSchemaType,
} from '@/modules/dashboard/dto/get-dashboard.dto';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@Roles(UserRole.USER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Dashboard',
    description:
      'Returns the full dashboard data for the authenticated user.\n\n' +
      '**Period behaviour:**\n' +
      '- `daily`   → today only\n' +
      '- `weekly`  → current ISO week (Mon → Sun)\n' +
      '- `monthly` → current calendar month (default)\n' +
      '- `yearly`  → current calendar year\n\n' +
      '**Document expiry alerts** are always period-independent and show ' +
      'documents expiring within the next 90 days.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'monthly',
    description:
      'Dashboard time period. Determines income/expense date range. Defaults to "monthly".',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully.',
    schema: {
      example: {
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          period: 'MONTHLY',
          dateRange: { startDate: '2026-08-01', endDate: '2026-08-31' },
          summary: {
            income: 85000.0,
            expense: 42375.0,
            savings: 15000.0,
            balance: 42625.0,
          },
          budget: {
            id: 'uuid',
            amount: 50000.0,
            spent: 42375.0,
            remaining: 7625.0,
            percentageUsed: 84.75,
            period: 'MONTHLY',
            startDate: '2026-08-01',
            endDate: '2026-08-31',
          },
          expenseBreakdown: [
            {
              categoryId: 'uuid',
              category: 'Food',
              amount: 12750.0,
              percentage: 30.12,
            },
          ],
          incomeVsExpense: [
            { label: '1', income: 0, expense: 500 },
            { label: '2', income: 85000, expense: 1000 },
          ],
          upcomingBills: [
            {
              id: 'uuid',
              title: 'Electricity Bill',
              amount: 1200.0,
              dueDate: '2026-08-25',
              status: 'PENDING',
              isRecurring: true,
              categoryId: 'uuid',
            },
          ],
          savingGoals: [
            {
              id: 'uuid',
              title: 'Buy Laptop',
              targetAmount: 80000.0,
              savedAmount: 15000.0,
              remainingAmount: 65000.0,
              progressPercent: 18.75,
              targetDate: '2027-01-01',
              status: 'ACTIVE',
              isCompleted: false,
            },
          ],
          documentAlerts: [
            {
              id: 'uuid',
              title: 'Passport',
              expiryDate: '2026-08-25',
              categoryName: 'Travel',
              daysUntilExpiry: 8,
            },
          ],
          recentTransactions: [
            {
              id: 'uuid',
              type: 'EXPENSE',
              amount: 1500.0,
              transactionDate: '2026-08-17',
              categoryName: 'Food',
              note: 'Grocery shopping',
              paymentMethod: 'CREDIT_CARD',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid period value.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getDashboard(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(getDashboardSchema))
    query: GetDashboardSchemaType,
  ) {
    const userId = req.user.sub;
    const data = await this.dashboardService.getDashboard(userId, query.period);

    return {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data,
    };
  }
}
