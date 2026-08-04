import { Module } from '@nestjs/common';
import { DocumentCategoryController } from './controllers/document-category.controller';
import { DocumentCategoryService } from './services/document-category.service';

@Module({
  controllers: [DocumentCategoryController],
  providers: [DocumentCategoryService],
})
export class DocumentCategoryModule {}
