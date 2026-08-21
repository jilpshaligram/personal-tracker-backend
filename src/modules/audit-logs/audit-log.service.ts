import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from '@/modules/audit-logs/audit-log.schema';
import { CreateAuditLogDto } from '@/modules/audit-logs/dto/create-audit-log.dto';
import { AuditLogFilterDto } from '@/modules/audit-logs/dto/audit-log-filter.dto';
import { Op } from 'sequelize';

import { User } from '@/modules/users/user.schema';

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async createLog(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = await this.auditLogModel.create(
        createAuditLogDto as unknown as Record<string, unknown>,
      );
      return auditLog;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to create audit log: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    filters: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLog>> {
    const where: Record<string | symbol, unknown> = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && {
          [Op.gte]: new Date(filters.dateFrom),
        }),
        ...(filters.dateTo && {
          [Op.lte]: new Date(filters.dateTo),
        }),
      };
    }

    if (filters.search) {
      where[Op.or] = [
        { ipAddress: { [Op.iLike]: `%${filters.search}%` } },
        { module: { [Op.iLike]: `%${filters.search}%` } },
        { requestUrl: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const queryOptions: Record<string, unknown> = {
      where: where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'email',
            'firstName',
            'lastName',
            'role',
            'profileImage',
          ],
          required: false,
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
    };

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 50;

    queryOptions.limit = limit;
    queryOptions.offset = (page - 1) * limit;

    const { count, rows } = await this.auditLogModel.findAndCountAll(
      queryOptions as unknown as Parameters<
        typeof this.auditLogModel.findAndCountAll
      >[0],
    );

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findByUser(
    userId: string,
    filters: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLog>> {
    const userFilters = { ...filters, userId };
    return this.findAll(userFilters);
  }

  async findById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogModel.findByPk(id);

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return auditLog;
  }
}
