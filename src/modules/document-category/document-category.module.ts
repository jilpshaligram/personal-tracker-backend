import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { DocumentCategory } from './models/document-category.model';
import { DocumentCategoryController } from './controllers/document-category.controller';
import { DocumentCategoryService } from './services/document-category.service';

@Module({
  imports: [
    SequelizeModule.forFeature([DocumentCategory]),
    AuthModule,
    SecurityModule,
  ],
  controllers: [DocumentCategoryController],
  providers: [DocumentCategoryService, AuthGuard],
  exports: [DocumentCategoryService],
})
export class DocumentCategoryModule {}
