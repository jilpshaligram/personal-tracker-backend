import { Controller } from '@nestjs/common';
import { BillService } from '../services/bill.service';

@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}
}
