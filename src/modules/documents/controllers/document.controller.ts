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

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryDocumentDto,
  ) {
    const data = await this.documentService.findAll(req.user.sub, query);

    return successResponse('Documents fetched successfully.', data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const data = await this.documentService.findOne(id, req.user.sub);

    return successResponse('Document fetched successfully.', data);
  }

  @Patch(':id')
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
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.documentService.remove(id, req.user.sub);

    return successResponse('Document deleted successfully.', null);
  }
}
