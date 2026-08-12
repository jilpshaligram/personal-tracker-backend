import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Query } from '@nestjs/common';
import { QueryDocumentCategoryDto } from '../dto/query-document-category.dto';
import { DocumentCategoryService } from '../services/document-category.service';
import {
  CreateDocumentCategoryDto,
  createDocumentCategorySchema,
} from '../dto/create-document-category.dto';
import {
  UpdateDocumentCategoryDto,
  updateDocumentCategorySchema,
} from '../dto/update-document-category.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';

@Controller('document-category')
export class DocumentCategoryController {
  constructor(
    private readonly documentCategoryService: DocumentCategoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createDocumentCategorySchema))
    dto: CreateDocumentCategoryDto,
  ) {
    const data = await this.documentCategoryService.create(dto);

    return successResponse('Document category created successfully.', data);
  }

  @Get()
  async findAll(@Query() query: QueryDocumentCategoryDto) {
    const data = await this.documentCategoryService.findAll(query);

    return successResponse('Document categories fetched successfully.', data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.documentCategoryService.findOne(id);

    return successResponse('Document category fetched successfully.', data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDocumentCategorySchema))
    dto: UpdateDocumentCategoryDto,
  ) {
    const data = await this.documentCategoryService.update(id, dto);

    return successResponse('Document category updated successfully.', data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.documentCategoryService.remove(id);

    return successResponse('Document category deleted successfully.', null);
  }
}
