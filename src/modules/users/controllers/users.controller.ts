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
import { UsersService } from '../services/users.service';
import type { FindAllOptions } from '../services/users.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { updateUserSchema } from '../dto/update-user.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Gender } from '../enums/gender.enum';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users
   *
   * Pagination  : ?page=1&limit=10
   * Search      : ?q=john         — searches firstName, lastName, email, phone
   * Filters     : ?role=USER&status=ACTIVE&gender=MALE&isVerified=true
   * Sorting     : ?sortBy=firstName&sortOrder=ASC
   *
   * Example:
   *   GET /users?q=john&status=ACTIVE&sortBy=firstName&sortOrder=ASC&page=1&limit=10
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    // Pagination
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    // Search
    @Query('q') search?: string,
    // Filters
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('gender') gender?: string,
    @Query('isVerified') isVerified?: string,
    // Sorting
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
      // Enum-guarded filters — ignore unknown values
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

  // GET /users/:id
  @Get(':id')
  @HttpCode(HttpStatus.OK)
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

  // PATCH /users/:id
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.updateUser(id, dto);
    return successResponse('User updated successfully.', {
      user: this.usersService.toSafeUser(updated),
    });
  }

  // DELETE /users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.usersService.softDeleteUser(id);
    return successResponse('User deleted successfully.');
  }
}
