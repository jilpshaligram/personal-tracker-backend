import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Document } from '../models/document.model';
import { DocumentCategory } from '../../document-category/models/document-category.model';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { QueryDocumentDto } from '../dto/query-document.dto';
import { DOCUMENT_QUERY_FIELDS } from '../constants/document-query-fields';
import { QueryHelper } from 'src/common/helpers/query.helper';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,

    @InjectModel(DocumentCategory)
    private readonly documentCategoryModel: typeof DocumentCategory,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private getUserId(userId: string | number): string {
    return String(userId);
  }

  async create(
    dto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string | number,
  ): Promise<Document> {
    const currentUserId = this.getUserId(userId);
    const category = await this.documentCategoryModel.findByPk(dto.categoryId);

    if (!category) {
      throw new BadRequestException(
        `Document category with id ${dto.categoryId} does not exist`,
      );
    }

    const uploadResult = await this.cloudinaryService.uploadPdf(file);

    return this.documentModel.create({
      userId: currentUserId,
      categoryId: dto.categoryId,
      title: dto.title,
      expiryDate: new Date(dto.expiryDate),
      reminderDaysBefore: dto.reminderDaysBefore,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
    });
  }

  async findAll(
    userId: string | number,
    query: QueryDocumentDto,
  ): Promise<{
    documents: Document[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const currentUserId = this.getUserId(userId);

    const queryResult = QueryHelper.build(query, DOCUMENT_QUERY_FIELDS);

    queryResult.where = {
      ...queryResult.where,
      userId: currentUserId,
    };

    const { count, rows } = await this.documentModel.findAndCountAll({
      where: queryResult.where,
      include: [
        {
          model: DocumentCategory,
          attributes: ['id', 'name'],
        },
      ],
      order: queryResult.order,
      offset: queryResult.offset,
      limit: queryResult.limit,
    });

    return {
      documents: rows,
      pagination: {
        total: count,
        page: queryResult.page,
        limit: queryResult.limit,
        totalPages: Math.ceil(count / queryResult.limit),
        hasNext: queryResult.page < Math.ceil(count / queryResult.limit),
        hasPrevious: queryResult.page > 1,
      },
    };
  }

  async findOne(id: string, userId: string | number): Promise<Document> {
    const currentUserId = this.getUserId(userId);
    const document = await this.documentModel.findOne({
      where: { id, userId: currentUserId },
      include: [
        {
          model: DocumentCategory,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!document) {
      throw new NotFoundException(`Document  not found`);
    }

    return document;
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    file: Express.Multer.File | undefined,
    userId: string | number,
  ): Promise<Document> {
    const currentUserId = this.getUserId(userId);
    const document = await this.findOne(id, currentUserId);

    if (dto.categoryId !== undefined) {
      const category = await this.documentCategoryModel.findByPk(
        dto.categoryId,
      );
      if (!category) {
        throw new BadRequestException(`Document category  does not exist`);
      }
    }

    const updateData: Partial<{
      categoryId: string;
      title: string;
      expiryDate: Date;
      reminderDaysBefore: number;
      fileUrl: string;
      filePublicId: string;
    }> = {
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.expiryDate !== undefined && {
        expiryDate: new Date(dto.expiryDate),
      }),
      ...(dto.reminderDaysBefore !== undefined && {
        reminderDaysBefore: dto.reminderDaysBefore,
      }),
    };

    if (file) {
      // Delete old file from Cloudinary
      await this.cloudinaryService.deletePdf(document.filePublicId);

      // Upload new file
      const uploadResult = await this.cloudinaryService.uploadPdf(file);
      updateData.fileUrl = uploadResult.secure_url;
      updateData.filePublicId = uploadResult.public_id;
    }

    await document.update(updateData);

    return document;
  }

  async remove(
    id: string,
    userId: string | number,
  ): Promise<{ message: string }> {
    const currentUserId = this.getUserId(userId);
    const document = await this.findOne(id, currentUserId);

    // Delete file from Cloudinary
    await this.cloudinaryService.deletePdf(document.filePublicId);

    await document.destroy();

    return { message: 'Document deleted successfully' };
  }
}
