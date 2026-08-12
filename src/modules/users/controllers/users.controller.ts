import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import type { FindAllOptions } from '../services/users.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { updateUserSchema, UpdateUserDto } from '../dto/update-user.dto';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Gender } from '../enums/gender.enum';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users', description: 'Supports pagination, search, role/status/gender filtering, and sorting.' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term for name/email/phone' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'gender', required: false, enum: Gender })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully.' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('gender') gender?: string,
    @Query('isVerified') isVerified?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '10', 10) || 10),
    );

    const options: FindAllOptions = {
      page: pageNum,
      limit: limitNum,
      search: search?.trim() || undefined,
      role: Object.values(UserRole).includes(role as UserRole)
        ? (role as UserRole)
        : undefined,
      status: Object.values(UserStatus).includes(status as UserStatus)
        ? (status as UserStatus)
        : undefined,
      gender: Object.values(Gender).includes(gender as Gender)
        ? (gender as Gender)
        : undefined,
      isVerified:
        isVerified === 'true'
          ? true
          : isVerified === 'false'
            ? false
            : undefined,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    };

    const { rows, count } = await this.usersService.findAll(options);
    const totalPages = Math.ceil(count / limitNum);

    return successResponse('Users fetched successfully.', {
      users: rows.map((u) => this.usersService.toSafeUser(u)),
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        search: options.search ?? null,
        role: options.role ?? null,
        status: options.status ?? null,
        gender: options.gender ?? null,
        isVerified: options.isVerified ?? null,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      },
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieves user details by ID.' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }
    return successResponse('User fetched successfully.', {
      user: this.usersService.toSafeUser(user),
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile', description: 'Updates user details.' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.updateUser(id, dto);
    return successResponse('User updated successfully.', {
      user: this.usersService.toSafeUser(updated),
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user', description: 'Soft deletes user account.' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  async remove(@Param('id') id: string) {
    await this.usersService.softDeleteUser(id);
    return successResponse('User deleted successfully.');
  }
}
