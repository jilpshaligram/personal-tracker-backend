import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

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
import { AuthGuard } from 'src/common/guards/auth.guard';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerDocumentOptions))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(createDocumentSchema)) dto: CreateDocumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    return this.documentService.create(dto, file, req.user.sub);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.documentService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', multerDocumentOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateDocumentSchema)) dto: UpdateDocumentDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentService.update(id, dto, file, req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentService.remove(id, req.user.sub);
  }
}
