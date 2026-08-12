import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
}
