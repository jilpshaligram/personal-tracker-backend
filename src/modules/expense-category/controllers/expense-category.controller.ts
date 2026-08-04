import { Controller } from '@nestjs/common';
import { ExpenseCategoryService } from '../services/expense-category.service';

@Controller('expense-category')
export class ExpenseCategoryController {
  constructor(
    private readonly expenseCategoryService: ExpenseCategoryService,
  ) {}
}
