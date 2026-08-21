import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreateCategoryDto } from '../dto/create-category.dto';
import type { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../schemas/category.schema';
import { CategoryTransactionType } from '../enums/category-transaction-type.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  /**
   * Helper to format category names to Title Case
   */
  private toTitleCase(str: string): string {
    return str
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Create a new custom category for a user.
   */
  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const formattedName = this.toTitleCase(createCategoryDto.name);

    try {
      // Check if the category already exists for the user OR as a system default
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
          // Category was soft-deleted, so we restore it and update its properties
          await existing.restore();
          return await existing.update({
            type: createCategoryDto.type,
            is_active: true,
          });
        }
        // It exists and is already active
        throw new ConflictException(`Category already exists.`);
      }

      return await this.categoryModel.create({
        name: formattedName,
        type: createCategoryDto.type,
        created_by: userId,
        is_default: false, // User-created categories are never default
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

  /**
   * Retrieves all available categories for a user.
   * This includes both system defaults and the user's custom categories.
   */
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

  /**
   * Finds a specific category and verifies the user has access to it.
   */
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

    // A user can access it if it's a default category OR if they created it
    if (!category.is_default && category.created_by !== userId) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Updates a user's custom category.
   * Prevents modification of system defaults.
   */
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

      // Check if it conflicts with an existing category (system default OR user's category)
      const existing = await this.categoryModel.findOne({
        where: {
          name: formattedName,
          id: { [Op.ne]: id }, // Exclude the current category being updated
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

  /**
   * Soft deletes a user's custom category.
   * Prevents deletion of system defaults.
   */
  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);

    if (category.is_default) {
      throw new ForbiddenException(
        'System default categories cannot be deleted',
      );
    }

    let deletedCount: number;

    try {
      // First, set is_active to false to keep it in sync with soft deletion
      await this.categoryModel.update(
        { is_active: false },
        { where: { id, is_default: false, is_active: true } },
      );

      // Then perform the actual soft delete (sets deleted_at)
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

  // --------------------------------------------------------------------------
  // REPOSITORY METHODS INTEGRATED INTO SERVICE (Used by other services too)
  // --------------------------------------------------------------------------

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
