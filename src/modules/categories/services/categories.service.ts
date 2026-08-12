import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CategoriesRepository } from '../repositories/categories.repository';
import type { CreateCategoryDto } from '../dto/create-category.dto';
import type { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../schemas/category.schema';
import { CategoryTransactionType } from '../enums/category-transaction-type.enum';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  /**
   * Create a new custom category for a user.
   */
  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return await this.categoriesRepository.create(createCategoryDto, userId);
  }

  /**
   * Retrieves all available categories for a user.
   * This includes both system defaults and the user's custom categories.
   */
  async findAllForUser(
    userId: string,
    type?: CategoryTransactionType,
  ): Promise<Category[]> {
    return await this.categoriesRepository.findAllForUser(userId, type);
  }

  /**
   * Finds a specific category and verifies the user has access to it.
   */
  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoriesRepository.findOneById(id);

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

    const [affectedCount, [updatedCategory]] =
      await this.categoriesRepository.update(id, userId, updateCategoryDto);

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

    const deletedCount = await this.categoriesRepository.softDelete(id);

    if (deletedCount === 0) {
      throw new NotFoundException('Category could not be deleted');
    }
  }
}
