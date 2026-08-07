import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { BillHistoryService } from '../services/bill-history.service';
import { BillService } from '../../bills/services/bill.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { apiResponse } from '../../../common/responses/api-response.helper';

@Controller('bills')
@UseGuards(AuthGuard)
export class BillHistoryController {
  constructor(
    private readonly billHistoryService: BillHistoryService,
    private readonly billService: BillService,
  ) {}

  @Get(':id/history')
  async findByBill(@Req() req: any, @Param('id') id: string) {
    await this.billService.findOne(req.user.sub, id);
    
    const data = await this.billHistoryService.findByBill(id);
    return apiResponse.success('Bill history fetched successfully', data);
  }
}
