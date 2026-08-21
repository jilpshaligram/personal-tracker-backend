import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DocumentCategory } from '@/modules/document-category/document-category.model';
import { CreateDocumentCategoryDto } from '@/modules/document-category/dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from '@/modules/document-category/dto/update-document-category.dto';
import { QueryHelper } from '@/common/helpers/query.helper';
import { QueryDocumentCategoryDto } from '@/modules/document-category/dto/query-document-category.dto';
import { DOCUMENT_CATEGORY_QUERY_FIELDS } from '@/modules/document-category/constants/document-category-query-fields';

@Injectable()
export class DocumentCategoryService {
  constructor(
    @InjectModel(DocumentCategory)
    private documentCategoryModel: typeof DocumentCategory,
  ) {}

  async create(dto: CreateDocumentCategoryDto) {
    const exists = await this.documentCategoryModel.findOne({
      where: { name: dto.name },
    });

    if (exists) {
      throw new ConflictException('Category already exists');
    }

    return this.documentCategoryModel.create({
      name: dto.name,
      status: dto.status ?? 'active',
    });
  }

  async findAll(query: QueryDocumentCategoryDto) {
    const queryResult = QueryHelper.build(
      query,
      DOCUMENT_CATEGORY_QUERY_FIELDS,
    );

    const { count, rows } = await this.documentCategoryModel.findAndCountAll({
      where: queryResult.where,
      order: queryResult.order,
      offset: queryResult.offset,
      limit: queryResult.limit,
    });

    return {
      categories: rows,

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

  async findOne(id: string) {
    const category = await this.documentCategoryModel.findByPk(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateDocumentCategoryDto) {
    const category = await this.findOne(id);

    await category.update(dto);

    return category;
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    await category.destroy();

    return {
      message: 'Category deleted successfully',
    };
  }
}
