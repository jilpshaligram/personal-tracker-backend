import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { AuthModule } from '../auth/auth.module';
import { Document } from './models/document.model';
import { DocumentCategory } from '../document-category/models/document-category.model';
import { DocumentController } from './controllers/document.controller';
import { DocumentService } from './services/document.service';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([Document, DocumentCategory]),
    AuthModule,
    CloudinaryModule,
    SecurityModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, AuthGuard],
  exports: [DocumentService],
})
export class DocumentModule {}
