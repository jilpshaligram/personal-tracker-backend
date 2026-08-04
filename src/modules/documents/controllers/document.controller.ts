import { Controller } from '@nestjs/common';
import { DocumentService } from '../services/document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}
}
