import { Controller } from '@nestjs/common';
import { IncomeCategoryService } from '../services/income-category.service';

@Controller('income-category')
export class IncomeCategoryController {
  constructor(private readonly incomeCategoryService: IncomeCategoryService) {}
}
