import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Query } from '@nestjs/common';
import { QueryDocumentDto } from '../dto/query-document.dto';
import { DocumentService } from '../services/document.service';
import {
  CreateDocumentDto,
  createDocumentSchema,
} from '../dto/create-document.dto';
import {
  UpdateDocumentDto,
  updateDocumentSchema,
} from '../dto/update-document.dto';
import { multerDocumentOptions } from '../multer.config';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from 'src/common/responses/api-response.helper';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload document',
    description: 'Uploads a PDF document with metadata.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'file',
        'categoryId',
        'title',
        'expiryDate',
        'reminderDaysBefore',
      ],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF Document File',
        },
        categoryId: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          description: 'Category UUID',
        },
        title: {
          type: 'string',
          example: 'Passport Copy',
          description: 'Document Title',
        },
        expiryDate: {
          type: 'string',
          example: '2028-12-31',
          description: 'Expiry Date (YYYY-MM-DD)',
        },
        reminderDaysBefore: {
          type: 'number',
          example: 30,
          description: 'Reminder Days Before Expiry',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document created successfully.' })
  @UseInterceptors(FileInterceptor('file', multerDocumentOptions))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(createDocumentSchema)) dto: CreateDocumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const data = await this.documentService.create(dto, file, req.user.sub);

    return successResponse('Document created successfully.', data);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all documents',
    description: 'Retrieves user documents with optional filtering.',
  })
  @ApiResponse({ status: 200, description: 'Documents fetched successfully.' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryDocumentDto,
  ) {
    const data = await this.documentService.findAll(req.user.sub, query);

    return successResponse('Documents fetched successfully.', data);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieves document details by ID.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const data = await this.documentService.findOne(id, req.user.sub);

    return successResponse('Document fetched successfully.', data);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update document',
    description: 'Updates document metadata or replaces the uploaded file.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Optional new PDF file',
        },
        categoryId: { type: 'string', description: 'Category UUID' },
        title: { type: 'string', description: 'Document Title' },
        expiryDate: { type: 'string', description: 'Expiry Date (YYYY-MM-DD)' },
        reminderDaysBefore: {
          type: 'number',
          description: 'Reminder Days Before Expiry',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Document updated successfully.' })
  @UseInterceptors(FileInterceptor('file', multerDocumentOptions))
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDocumentSchema)) dto: UpdateDocumentDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data = await this.documentService.update(id, dto, file, req.user.sub);

    return successResponse('Document updated successfully.', data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Deletes a document.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully.' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.documentService.remove(id, req.user.sub);

    return successResponse('Document deleted successfully.', null);
  }
}
