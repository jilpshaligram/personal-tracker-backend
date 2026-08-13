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
import { UsersService } from '../services/users.service';
import type { FindAllOptions } from '../services/users.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { updateUserSchema, UpdateUserDto } from '../dto/update-user.dto';
import { updateProfileSchema } from '../dto/update-profile.dto';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Gender } from '../enums/gender.enum';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─── My Profile ──────────────────────────────────────────────────────────

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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
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
      'email and phone cannot be changed here — they require a separate verification flow.',
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
            'Upload an image file (max 5 MB). Ignored if sending JSON with profileImage URL.',
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
    // If a file was uploaded, push it to Cloudinary and use the secure URL
    let profileImageUrl: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      profileImageUrl = result.secure_url;
    }

    // Merge raw body + uploaded image URL, then validate through Zod
    const payload = {
      ...rawBody,
      ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
    };

    const parsed = updateProfileSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
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

  // ─── Admin / General ─────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users',
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
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves user details by ID.',
  })
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
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates user details.',
  })
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
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft deletes user account.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  async remove(@Param('id') id: string) {
    await this.usersService.softDeleteUser(id);
    return successResponse('User deleted successfully.');
  }
}
