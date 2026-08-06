import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DocumentCategory } from '../models/document-category.model';
import { CreateDocumentCategoryDto } from '../dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from '../dto/update-document-category.dto';

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
    });
  }

  async findAll() {
    return this.documentCategoryModel.findAll({
      order: [['id', 'ASC']],
    });
  }

  async findOne(id: number) {
    const category = await this.documentCategoryModel.findByPk(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: number, dto: UpdateDocumentCategoryDto) {
    const category = await this.findOne(id);

    await category.update(dto);

    return category;
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    await category.destroy();

    return {
      message: 'Category deleted successfully',
    };
  }
}
