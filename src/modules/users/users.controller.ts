import {
  BadRequestException,
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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '@/modules/users/users.service';
import type { FindAllOptions } from '@/modules/users/users.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { successResponse } from '@/common/responses/api-response.helper';
import {
  updateUserSchema,
  UpdateUserDto,
} from '@/modules/users/dto/update-user.dto';
import { updateProfileSchema } from '@/modules/users/dto/update-profile.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
import { UserStatus } from '@/modules/users/enums/user-status.enum';
import { Gender } from '@/modules/users/enums/gender.enum';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my profile',
    description:
      'Returns the profile of the currently authenticated user: userId, firstName, lastName, email, phone, role, profileImage, dateOfBirth, gender.',
  })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }
    const safe = this.usersService.toSafeUser(user);
    return successResponse('Profile fetched successfully.', {
      userId: safe.id,
      firstName: safe.firstName,
      lastName: safe.lastName,
      email: safe.email,
      phone: safe.phone,
      role: safe.role,
      profileImage: safe.profileImage,
      dateOfBirth: safe.dateOfBirth,
      gender: safe.gender,
    });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException(
              'Only image files are allowed for profileImage',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Update my profile',
    description:
      'Accepts multipart/form-data OR application/json. ' +
      'email and phone cannot be changed here — they require a separate verification flow. ' +
      'Pass profileImage as null or empty string to remove existing profile image.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        dateOfBirth: { type: 'string', example: '1995-05-15' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        profileImage: {
          type: 'string',
          format: 'binary',
          description:
            'Upload an image file (max 5 MB) or pass URL / null / empty string to remove.',
        },
        notificationEnabled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: Record<string, unknown>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let profileImageUrl: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadFile(file, 'profiles');
      profileImageUrl = result.secure_url;
    }

    const payload = {
      ...rawBody,
      ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
    };

    const parsed = updateProfileSchema.safeParse(payload);
    if (!parsed.success) {
      if (file && profileImageUrl) {
        await this.cloudinaryService.deleteByUrl(profileImageUrl);
      }
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    if (parsed.data.profileImage !== undefined) {
      const currentUser = await this.usersService.findById(req.user.sub);
      if (
        currentUser?.profileImage &&
        currentUser.profileImage !== parsed.data.profileImage
      ) {
        await this.cloudinaryService.deleteByUrl(currentUser.profileImage);
      }
    }

    const updated = await this.usersService.updateUser(
      req.user.sub,
      parsed.data,
    );
    const safe = this.usersService.toSafeUser(updated);
    return successResponse('Profile updated successfully.', {
      userId: safe.id,
      firstName: safe.firstName,
      lastName: safe.lastName,
      email: safe.email,
      phone: safe.phone,
      role: safe.role,
      profileImage: safe.profileImage,
      dateOfBirth: safe.dateOfBirth,
      gender: safe.gender,
    });
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users (Super Admin only)',
    description:
      'Supports pagination, search, role/status/gender filtering, and sorting.',
  })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search term for name/email/phone',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'gender', required: false, enum: Gender })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required.',
  })
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
      users: rows,
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
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID (Super Admin only)',
    description: 'Retrieves user details by ID.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required.',
  })
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
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile (Super Admin only)',
    description: 'Updates user details.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required.',
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
  ) {
    if (dto.profileImage !== undefined) {
      const existingUser = await this.usersService.findById(id);
      if (
        existingUser?.profileImage &&
        existingUser.profileImage !== dto.profileImage
      ) {
        await this.cloudinaryService.deleteByUrl(existingUser.profileImage);
      }
    }
    const updated = await this.usersService.updateUser(id, dto);
    return successResponse('User updated successfully.', {
      user: this.usersService.toSafeUser(updated),
    });
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user (Super Admin only)',
    description: 'Soft deletes user account.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required.',
  })
  async remove(@Param('id') id: string) {
    await this.usersService.softDeleteUser(id);
    return successResponse('User deleted successfully.');
  }
}
