import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { AuthGuard } from '../../../common/guards/auth.guard';
import { DocumentCategoryService } from '../services/document-category.service';
import {
  CreateDocumentCategoryDto,
  createDocumentCategorySchema,
} from '../dto/create-document-category.dto';
import {
  UpdateDocumentCategoryDto,
  updateDocumentCategorySchema,
} from '../dto/update-document-category.dto';
import { ParseIntPipe } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

@UseGuards(AuthGuard)
@Controller('document-category')
export class DocumentCategoryController {
  constructor(
    private readonly documentCategoryService: DocumentCategoryService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createDocumentCategorySchema))
  create(@Body() dto: CreateDocumentCategoryDto) {
    return this.documentCategoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.documentCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentCategoryService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateDocumentCategorySchema))
  update(@Param('id') id: number, @Body() dto: UpdateDocumentCategoryDto) {
    return this.documentCategoryService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.documentCategoryService.remove(+id);
  }
}
