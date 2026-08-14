import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from '../schemas/audit-log.schema';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { Op, WhereOptions, Optional } from 'sequelize';

/**
 * Paginated query result interface
 */
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

  /**
   * Create a new audit log entry
   * @param createAuditLogDto - Audit log data
   * @returns Created audit log
   */
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
      // Don't throw error - audit logging failures shouldn't disrupt the application
      throw error;
    }
  }

  /**
   * Find all audit logs with filtering and pagination
   * @param filters - Filter criteria
   * @returns Query result with paginated audit logs
   */
  async findAll(
    filters: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLog>> {
    const where: WhereOptions = {};

    // Apply filters
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.createdAt[Op.gte] = new Date(filters.dateFrom);
      }

      if (filters.dateTo) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.createdAt[Op.lte] = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.ipAddress = { [Op.iLike]: `%${filters.search}%` };
    }

    // Default values
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    // Execute paginated query
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

  /**
   * Find audit logs for a specific user with filtering and pagination
   * @param userId - User ID
   * @param filters - Filter criteria
   * @returns Query result with paginated audit logs
   */
  async findByUser(
    userId: string,
    filters: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLog>> {
    // Ensure user can only see their own logs
    const userFilters = { ...filters, userId };
    return this.findAll(userFilters);
  }

  /**
   * Find audit logs for a specific entity
   * @param entityType - Entity type
   * @param entityId - Entity ID
   * @returns Audit logs for the entity
   */
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
      limit: 100, // Limit to prevent excessive data retrieval
    });

    return logs.map((log) => log.toJSON());
  }

  /**
   * Find audit log by ID
   * @param id - Audit log ID
   * @returns Audit log
   * @throws NotFoundException if audit log not found
   */
  async findById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogModel.findByPk(id);

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return auditLog.toJSON();
  }
}
