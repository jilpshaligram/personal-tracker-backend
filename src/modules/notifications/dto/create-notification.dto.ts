import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;
}