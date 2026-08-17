import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from '../schemas/audit-log.schema';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { Op, Optional } from 'sequelize';

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
        createAuditLogDto as unknown as Optional<any, string>,
      );
      return auditLog.toJSON();
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  async findAll(
    filters: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLog>> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};

      if (filters.dateFrom) {
        where.createdAt[Op.gte] = new Date(filters.dateFrom);
      }

      if (filters.dateTo) {
        where.createdAt[Op.lte] = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.ipAddress = { [Op.iLike]: `%${filters.search}%` };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const { count, rows } = await this.auditLogModel.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    return {
      data: rows.map((log) => log.toJSON()),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

  async findByUser(
    userId: string,
    filters: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLog>> {
    const userFilters = { ...filters, userId };
    return this.findAll(userFilters);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    const logs = await this.auditLogModel.findAll({
      where: {
        entityType,
        entityId,
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    return logs.map((log) => log.toJSON());
  }

  async findById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogModel.findByPk(id);

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return auditLog.toJSON();
  }
}
