import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsISO8601,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActionType } from '../enums/action-type.enum';
import { Type } from 'class-transformer';

export class AuditLogFilterDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
    required: false,
    default: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(200)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiProperty({
    description: 'Filter by user ID (UUID)',
    example: '9c5601ec-79a7-4ecc-862a-e0defa990569',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Filter by module name',
    example: 'bills',
    required: false,
  })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({
    description: 'Filter by action type',
    enum: ActionType,
    example: ActionType.CREATE,
    required: false,
  })
  @IsEnum(ActionType)
  @IsOptional()
  action?: ActionType;

  @ApiProperty({
    description: 'Filter by entity type',
    example: 'Bill',
    required: false,
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiProperty({
    description: 'Filter by entity ID (UUID)',
    example: '09527b00-5673-43f6-b592-1a5279b33a73',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'Filter by start date (ISO format)',
    example: '2026-08-01T00:00:00Z',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter by end date (ISO format)',
    example: '2026-08-14T23:59:59Z',
    required: false,
  })
  @IsISO8601()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({
    description: 'Search by IP address',
    example: '192.168.1',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['createdAt', 'action', 'module'],
    example: 'createdAt',
    required: false,
    default: 'createdAt',
  })
  @IsEnum(['createdAt', 'action', 'module'])
  @IsOptional()
  sortBy?: 'createdAt' | 'action' | 'module' = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    required: false,
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
