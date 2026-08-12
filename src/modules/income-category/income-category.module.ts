import { Module } from '@nestjs/common';
import { IncomeCategoryController } from './controllers/income-category.controller';
import { IncomeCategoryService } from './services/income-category.service';

@Module({
  controllers: [IncomeCategoryController],
  providers: [IncomeCategoryService],
})
export class IncomeCategoryModule {}
