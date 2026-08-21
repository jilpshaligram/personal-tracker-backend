import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { BillHistoryService } from '@/modules/bill-history/bill-history.service';
import { BillService } from '@/modules/bills/bill.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { apiResponse } from '@/common/responses/api-response.helper';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';

@ApiTags('Bill History')
@ApiBearerAuth()
@Controller('bills')
@UseGuards(AuthGuard)
@Roles(UserRole.USER)
export class BillHistoryController {
  constructor(
    private readonly billHistoryService: BillHistoryService,
    private readonly billService: BillService,
  ) {}

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get payment history for a bill',
    description: 'Retrieves payment history logs for a specific bill.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiResponse({
    status: 200,
    description: 'Bill history fetched successfully.',
  })
  async findByBill(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.billService.findOne(req.user.sub, id);

    const { data, pagination } = await this.billHistoryService.findByBill(id);
    return apiResponse.success(
      'Bill history fetched successfully',
      data,
      pagination,
    );
  }
}
