import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from '@/modules/categories/categories.service';
import { CategoryTransactionType } from '@/modules/categories/enums/category-transaction-type.enum';
import {
  createCategorySchema,
  CreateCategoryDto,
} from '@/modules/categories/dto/create-category.dto';
import {
  updateCategorySchema,
  UpdateCategoryDto,
} from '@/modules/categories/dto/update-category.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(AuthGuard)
@Roles(UserRole.USER)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create custom category',
    description: 'Creates a new user-defined custom category.',
  })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  async create(
    @Req() req: AuthenticatedRequest,
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

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieves all system default and custom user categories.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully.',
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('type') type?: CategoryTransactionType,
  ) {
    const userId = req.user.sub;
    const categories = await this.categoriesService.findAllForUser(
      userId,
      type,
    );

    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieves a single category by ID.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully.' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const category = await this.categoriesService.findOne(id, userId);

    return {
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update custom category',
    description:
      'Updates custom category details (System defaults cannot be edited).',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
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

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete custom category',
    description:
      'Deletes a custom category (System defaults cannot be deleted).',
  })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.categoriesService.remove(id, userId);

    return {
      success: true,
      message: 'Category deleted successfully',
      data: null,
    };
  }
}
