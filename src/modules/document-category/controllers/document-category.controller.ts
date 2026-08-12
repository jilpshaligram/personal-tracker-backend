import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Query } from '@nestjs/common';
import { QueryDocumentCategoryDto } from '../dto/query-document-category.dto';
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
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';

@ApiTags('Document Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('document-category')
export class DocumentCategoryController {
  constructor(
    private readonly documentCategoryService: DocumentCategoryService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Document Category', description: 'Creates a new document classification category.' })
  @ApiResponse({ status: 201, description: 'Document category created successfully.' })
  async create(
    @Body(new ZodValidationPipe(createDocumentCategorySchema))
    dto: CreateDocumentCategoryDto,
  ) {
    const data = await this.documentCategoryService.create(dto);

    return successResponse('Document category created successfully.', data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Document Categories', description: 'Retrieves document categories with filtering.' })
  @ApiResponse({ status: 200, description: 'Document categories fetched successfully.' })
  async findAll(@Query() query: QueryDocumentCategoryDto) {
    const data = await this.documentCategoryService.findAll(query);

    return successResponse('Document categories fetched successfully.', data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Document Category by ID', description: 'Retrieves document category details.' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Document category fetched successfully.' })
  async findOne(@Param('id') id: string) {
    const data = await this.documentCategoryService.findOne(id);

    return successResponse('Document category fetched successfully.', data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Document Category', description: 'Updates document category details.' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Document category updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDocumentCategorySchema))
    dto: UpdateDocumentCategoryDto,
  ) {
    const data = await this.documentCategoryService.update(id, dto);

    return successResponse('Document category updated successfully.', data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Document Category', description: 'Deletes a document category.' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Document category deleted successfully.' })
  async remove(@Param('id') id: string) {
    await this.documentCategoryService.remove(id);

    return successResponse('Document category deleted successfully.', null);
  }
}
