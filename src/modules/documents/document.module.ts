import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { AuthModule } from '@/modules/auth/auth.module';
import { Document } from '@/modules/documents/document.model';
import { DocumentCategory } from '@/modules/document-category/document-category.model';
import { DocumentController } from '@/modules/documents/document.controller';
import { DocumentService } from '@/modules/documents/document.service';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { AuthGuard } from '@/common/guards/auth.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([Document, DocumentCategory]),
    AuthModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, CloudinaryService, AuthGuard],
  exports: [DocumentService],
})
export class DocumentModule {}
