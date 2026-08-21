import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { AuthModule } from '@/modules/auth/auth.module';
import { AuthGuard } from '@/common/guards/auth.guard';
import { DocumentCategory } from '@/modules/document-category/document-category.model';
import { DocumentCategoryController } from '@/modules/document-category/document-category.controller';
import { DocumentCategoryService } from '@/modules/document-category/document-category.service';

@Module({
  imports: [SequelizeModule.forFeature([DocumentCategory]), AuthModule],
  controllers: [DocumentCategoryController],
  providers: [DocumentCategoryService, AuthGuard],
  exports: [DocumentCategoryService],
})
export class DocumentCategoryModule {}
