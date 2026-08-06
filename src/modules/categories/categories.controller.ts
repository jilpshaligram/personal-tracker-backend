import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  createCategorySchema,
} from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  updateCategorySchema,
} from './dto/update-category.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Request } from 'express';
import { IJwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Creates a new custom category.
   * Zod validation ensures exactly what is required is provided.
   */
  @Post()
  async create(
    @Req() req: Request & { user: IJwtPayload },
    @Body(new ZodValidationPipe(createCategorySchema))
    createCategoryDto: CreateCategoryDto,
  ) {
    const userId = req.user.sub;
    const category = await this.categoriesService.create(
      userId,
      createCategoryDto,
    );

    return {
      success: true,
      message: 'Category created successfully',
      data: category,
    };
  }

  /**
   * Retrieves all default + custom categories for the authenticated user.
   */
  @Get()
  async findAll(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;
    const categories = await this.categoriesService.findAllForUser(userId);

    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  /**
   * Retrieves a specific category. Validates user owns it or it's default.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: IJwtPayload },
  ) {
    const userId = req.user.sub;
    const category = await this.categoriesService.findOne(id, userId);

    return {
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  /**
   * Updates an existing custom category.
   * System default categories cannot be modified.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: Request & { user: IJwtPayload },
    @Body(new ZodValidationPipe(updateCategorySchema))
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const userId = req.user.sub;
    const category = await this.categoriesService.update(
      id,
      userId,
      updateCategoryDto,
    );

    return {
      success: true,
      message: 'Category updated successfully',
      data: category,
    };
  }

  /**
   * Deletes a custom category.
   * System default categories cannot be deleted.
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: IJwtPayload },
  ) {
    const userId = req.user.sub;
    await this.categoriesService.remove(id, userId);

    return {
      success: true,
      message: 'Category deleted successfully',
      data: null,
    };
  }
}
