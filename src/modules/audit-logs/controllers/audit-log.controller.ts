import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { apiResponse } from '../../../common/responses/api-response.helper';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(AuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get audit logs',
    description:
      'Retrieve audit logs with filtering, pagination, and sorting. Regular users can only see their own logs.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'module', required: false, type: String, example: 'bills' })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    example: 'CREATE',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    example: '2026-08-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    example: '2026-08-14T23:59:59Z',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by IP address',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'action', 'module'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required.',
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filter: AuditLogFilterDto,
  ) {
    try {
      const userId = req.user.sub;

      const userFilters = { ...filter, userId };

      const result = await this.auditLogService.findAll(userFilters);
      return apiResponse.success(
        'Audit logs retrieved successfully',
        result.data,
        result.pagination,
      );
    } catch (err) {
      const error = err as Error & { name?: string };
      if (
        error.name === 'SequelizeDatabaseError' ||
        error.name === 'ValidationError'
      ) {
        throw new BadRequestException({
          success: false,
          message: 'Invalid query parameters',
          errors: [{ message: error.message }],
        });
      }
      throw error;
    }
  }
}
