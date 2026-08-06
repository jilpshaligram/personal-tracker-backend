import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesRepository {
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
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Creates a new custom category for a user.
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
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
   * Finds all categories available for a specific user.
   * This includes both their custom categories (created_by = userId)
   * and all system defaults (is_default = true).
   * Results are sorted by type (ASC) and name (ASC).
   */
  async findAllForUser(userId: string): Promise<Category[]> {
    try {
      return await this.categoryModel.findAll({
        where: {
          [Op.or]: [{ created_by: userId }, { is_default: true }],
          is_active: true,
        },
        order: [
          ['type', 'ASC'],
          ['name', 'ASC'],
        ],
      });
    } catch {
      throw new InternalServerErrorException('Failed to retrieve categories');
    }
  }

  /**
   * Finds a specific category by ID (ensuring it belongs to the user or is a system default).
   */
  async findOneById(id: string): Promise<Category | null> {
    try {
      return await this.categoryModel.findOne({
        where: { id, is_active: true },
      });
    } catch {
      throw new InternalServerErrorException('Failed to retrieve category');
    }
  }

  /**
   * Updates an existing custom category.
   * Note: The service layer should verify the user owns the category before calling this.
   */
  async update(
    id: string,
    userId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<[number, Category[]]> {
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
        if (existing.is_default) {
          throw new ConflictException(`Category already exists.`);
        }
        throw new ConflictException(`Category already exists.`);
      }
    }

    try {
      return await this.categoryModel.update(updateCategoryDto, {
        where: { id, is_default: false, is_active: true },
        returning: true,
      });
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
  }

  /**
   * Soft deletes a custom category.
   * Note: The service layer should verify the user owns the category before calling this.
   */
  async softDelete(id: string): Promise<number> {
    try {
      // First, set is_active to false to keep it in sync with soft deletion
      await this.categoryModel.update(
        { is_active: false },
        { where: { id, is_default: false, is_active: true } },
      );

      // Then perform the actual soft delete (sets deleted_at)
      return await this.categoryModel.destroy({
        where: { id, is_default: false },
      });
    } catch {
      throw new InternalServerErrorException('Failed to delete category');
    }
  }
}
