import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActionType } from '@/modules/audit-logs/enums/action-type.enum';

export class CreateAuditLogDto {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '9c5601ec-79a7-4ecc-862a-e0defa990569',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Module name',
    example: 'bills',
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: 'Action type',
    enum: ActionType,
    example: ActionType.CREATE,
  })
  @IsEnum(ActionType)
  @IsNotEmpty()
  action: ActionType;

  @ApiProperty({
    description: 'Client IP address',
    example: '192.168.1.1',
  })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({
    description: 'User agent (browser/client information)',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @ApiProperty({
    description: 'HTTP request method',
    example: 'POST',
  })
  @IsString()
  @IsNotEmpty()
  requestMethod: string;

  @ApiProperty({
    description: 'Request URL path',
    example: '/api/v1/bills',
  })
  @IsString()
  @IsNotEmpty()
  requestUrl: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 201,
  })
  @IsNumber()
  @IsNotEmpty()
  statusCode: number;

  @ApiProperty({
    description: 'Changes (before/after) for UPDATE actions',
    example: { before: { amount: 100 }, after: { amount: 150 } },
    required: false,
  })
  @IsOptional()
  changes?: Record<string, any> | null;

  @ApiProperty({
    description: 'Additional metadata',
    example: { correlationId: 'abc-123', durationMs: 120 },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any> | null;
}
