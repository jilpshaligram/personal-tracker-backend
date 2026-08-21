import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreateCategoryDto } from '@/modules/categories/dto/create-category.dto';
import type { UpdateCategoryDto } from '@/modules/categories/dto/update-category.dto';
import { Category } from '@/modules/categories/category.schema';
import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  private toTitleCase(str: string): string {
    return str
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const formattedName = this.toTitleCase(createCategoryDto.name);

    try {
      const existing = await this.categoryModel.findOne({
        where: {
          name: formattedName,
          [Op.or]: [{ created_by: userId }, { is_default: true }],
        },
        paranoid: false,
      });

      if (existing) {
        if (existing.is_active) {
          throw new ConflictException(`Category already exists.`);
        }

        if (
          existing.deletedAt !== null ||
          existing.getDataValue('deleted_at') !== null
        ) {
          await existing.restore();
          return await existing.update({
            type: createCategoryDto.type,
            is_active: true,
          });
        }
        throw new ConflictException(`Category already exists.`);
      }

      return await this.categoryModel.create({
        name: formattedName,
        type: createCategoryDto.type,
        created_by: userId,
        is_default: false,
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException(`Category already exists.`);
      }
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async findAllForUser(
    userId: string,
    type?: CategoryTransactionType,
  ): Promise<Category[]> {
    try {
      const whereClause = {
        [Op.or]: [{ created_by: userId }, { is_default: true }],
        is_active: true,
        ...(type ? { type } : {}),
      };

      return await this.categoryModel.findAll({
        where: whereClause,
        order: type
          ? [['name', 'ASC']]
          : [
              ['type', 'ASC'],
              ['name', 'ASC'],
            ],
      });
    } catch {
      throw new InternalServerErrorException('Failed to retrieve categories');
    }
  }

  async findOne(id: string, userId: string): Promise<Category> {
    let category: Category | null;
    try {
      category = await this.categoryModel.findOne({
        where: { id, is_active: true },
      });
    } catch {
      throw new InternalServerErrorException('Failed to retrieve category');
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.is_default && category.created_by !== userId) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    userId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id, userId);

    if (category.is_default) {
      throw new ForbiddenException(
        'System default categories cannot be modified',
      );
    }

    if (updateCategoryDto.name) {
      updateCategoryDto.name = this.toTitleCase(updateCategoryDto.name);
      const formattedName = updateCategoryDto.name;

      const existing = await this.categoryModel.findOne({
        where: {
          name: formattedName,
          id: { [Op.ne]: id },
          [Op.or]: [{ created_by: userId }, { is_default: true }],
        },
        paranoid: false,
      });

      if (existing) {
        throw new ConflictException(`Category already exists.`);
      }
    }

    let updatedCategory: Category;
    let affectedCount: number;

    try {
      [affectedCount, [updatedCategory]] = await this.categoryModel.update(
        updateCategoryDto,
        {
          where: { id, is_default: false, is_active: true },
          returning: true,
        },
      );
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException(`Category already exists.`);
      }
      throw new InternalServerErrorException('Failed to update category');
    }

    if (affectedCount === 0) {
      throw new NotFoundException('Category could not be updated');
    }

    return updatedCategory;
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);

    if (category.is_default) {
      throw new ForbiddenException(
        'System default categories cannot be deleted',
      );
    }

    let deletedCount: number;

    try {
      await this.categoryModel.update(
        { is_active: false },
        { where: { id, is_default: false, is_active: true } },
      );

      deletedCount = await this.categoryModel.destroy({
        where: { id, is_default: false },
      });
    } catch {
      throw new InternalServerErrorException('Failed to delete category');
    }

    if (deletedCount === 0) {
      throw new NotFoundException('Category could not be deleted');
    }
  }

  async findOneById(id: string): Promise<Category | null> {
    try {
      return await this.categoryModel.findOne({
        where: { id, is_active: true },
      });
    } catch {
      throw new InternalServerErrorException('Failed to retrieve category');
    }
  }
}
