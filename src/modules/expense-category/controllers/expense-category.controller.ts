import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExpenseCategoryService } from '../services/expense-category.service';

@ApiTags('Expense Categories')
@Controller('expense-category')
export class ExpenseCategoryController {
  constructor(
    private readonly expenseCategoryService: ExpenseCategoryService,
  ) {}
}
