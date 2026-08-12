import { Module } from '@nestjs/common';
import { ExpenseCategoryController } from './controllers/expense-category.controller';
import { ExpenseCategoryService } from './services/expense-category.service';

@Module({
  controllers: [ExpenseCategoryController],
  providers: [ExpenseCategoryService],
})
export class ExpenseCategoryModule {}
