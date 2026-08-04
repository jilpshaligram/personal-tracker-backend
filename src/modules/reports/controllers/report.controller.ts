import { Controller } from '@nestjs/common';
import { ReportService } from '../services/report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
}
