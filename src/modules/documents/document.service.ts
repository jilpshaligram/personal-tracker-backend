import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Document } from '@/modules/documents/document.model';
import { DocumentCategory } from '@/modules/document-category/document-category.model';
import { CreateDocumentDto } from '@/modules/documents/dto/create-document.dto';
import { UpdateDocumentDto } from '@/modules/documents/dto/update-document.dto';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';
import { QueryDocumentDto } from '@/modules/documents/dto/query-document.dto';
import { DOCUMENT_QUERY_FIELDS } from '@/modules/documents/constants/document-query-fields';
import { QueryHelper } from '@/common/helpers/query.helper';

type DocumentResponse = {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  expiryDate: Date | null;
  reminderDaysBefore: number;
  fileUrl: string;
  filePublicId: string;
  fileResourceType: 'image' | 'raw' | 'video';
  category?: DocumentCategory;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  viewUrl: string;
};

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

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const uploadResult = await this.cloudinaryService.uploadFile(file);

    return this.documentModel.create({
      userId: currentUserId,
      categoryId: dto.categoryId,
      title: dto.title,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      reminderDaysBefore: dto.reminderDaysBefore ?? 7,
      fileUrl: uploadResult.secure_url,
      filePublicId: uploadResult.public_id,
      fileResourceType:
        uploadResult.resource_type === 'image' ||
        uploadResult.resource_type === 'video'
          ? uploadResult.resource_type
          : 'raw',
    });
  }
  private async findDocument(
    id: string,
    userId: string | number,
  ): Promise<Document> {
    const currentUserId = this.getUserId(userId);

    const document = await this.documentModel.findOne({
      where: {
        id,
        userId: currentUserId,
      },
      include: [
        {
          model: DocumentCategory,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async findAll(
    userId: string | number,
    query: QueryDocumentDto,
  ): Promise<{
    documents: DocumentResponse[];
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

    const totalPages = Math.ceil(count / queryResult.limit);
    const documentsWithViewUrl: DocumentResponse[] = rows.map((document) => ({
      ...document.toJSON(),
      viewUrl: this.cloudinaryService.getViewUrl(
        document.filePublicId,
        document.fileResourceType,
        document.fileUrl,
      ),
    }));

    return {
      documents: documentsWithViewUrl,
      pagination: {
        total: count,
        page: queryResult.page,
        limit: queryResult.limit,
        totalPages,
        hasNext: queryResult.page < totalPages,
        hasPrevious: queryResult.page > 1,
      },
    };
  }

  async findOne(id: string, userId: string | number) {
    const document = await this.findDocument(id, userId);

    const viewUrl = this.cloudinaryService.getViewUrl(
      document.filePublicId,
      document.fileResourceType,
      document.fileUrl,
    );

    return {
      ...document.toJSON(),
      viewUrl,
    };
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    file: Express.Multer.File | undefined,
    userId: string | number,
  ): Promise<Document> {
    const currentUserId = this.getUserId(userId);

    const document = await this.findDocument(id, currentUserId);

    if (dto.categoryId !== undefined) {
      const category = await this.documentCategoryModel.findByPk(
        dto.categoryId,
      );

      if (!category) {
        throw new BadRequestException(
          `Document category with id ${dto.categoryId} does not exist`,
        );
      }
    }

    const updateData: Partial<{
      categoryId: string;
      title: string;
      expiryDate: Date | null;
      reminderDaysBefore: number;
      fileUrl: string;
      filePublicId: string;
      fileResourceType: 'image' | 'raw' | 'video';
    }> = {
      ...(dto.categoryId !== undefined && {
        categoryId: dto.categoryId,
      }),

      ...(dto.title !== undefined && {
        title: dto.title,
      }),

      ...(dto.expiryDate !== undefined && {
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      }),

      ...(dto.reminderDaysBefore !== undefined && {
        reminderDaysBefore: dto.reminderDaysBefore,
      }),
    };

    if (file) {
      if (document.filePublicId) {
        await this.cloudinaryService.deleteFile(
          document.filePublicId,
          document.fileResourceType,
        );
      }

      const uploadResult = await this.cloudinaryService.uploadFile(file);

      updateData.fileUrl = uploadResult.secure_url;
      updateData.filePublicId = uploadResult.public_id;
      updateData.fileResourceType =
        uploadResult.resource_type === 'image' ||
        uploadResult.resource_type === 'video'
          ? uploadResult.resource_type
          : 'raw';
    }

    await document.update(updateData);

    return document;
  }

  async remove(
    id: string,
    userId: string | number,
  ): Promise<{ message: string }> {
    const currentUserId = this.getUserId(userId);

    const document = await this.findDocument(id, currentUserId);

    if (document.filePublicId) {
      await this.cloudinaryService.deleteFile(
        document.filePublicId,
        document.fileResourceType,
      );
    }

    await document.destroy();

    return {
      message: 'Document deleted successfully',
    };
  }
}
