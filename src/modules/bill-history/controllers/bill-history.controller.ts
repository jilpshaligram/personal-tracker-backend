import { Controller } from '@nestjs/common';
import { BillHistoryService } from '../services/bill-history.service';

@Controller('bill-history')
export class BillHistoryController {
  constructor(private readonly billHistoryService: BillHistoryService) {}
}
