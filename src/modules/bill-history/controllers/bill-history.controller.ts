import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BillHistoryService } from '../services/bill-history.service';
import { BillService } from '../../bills/services/bill.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { apiResponse } from '../../../common/responses/api-response.helper';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@Controller('bills')
@UseGuards(AuthGuard)
export class BillHistoryController {
  constructor(
    private readonly billHistoryService: BillHistoryService,
    private readonly billService: BillService,
  ) {}

  @Get(':id/history')
  async findByBill(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.billService.findOne(req.user.sub, id);

    const data = await this.billHistoryService.findByBill(id);
    return apiResponse.success('Bill history fetched successfully', data);
  }
}
