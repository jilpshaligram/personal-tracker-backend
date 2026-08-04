import { Controller } from '@nestjs/common';
import { DocumentCategoryService } from '../services/document-category.service';

@Controller('document-category')
export class DocumentCategoryController {
  constructor(
    private readonly documentCategoryService: DocumentCategoryService,
  ) {}
}
