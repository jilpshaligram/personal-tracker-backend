import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';
import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Public } from '@/common/decorators/public.decorator';

import { IJwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';
import { RegisterDeviceDto } from '@/modules/notifications/dto/register-device.dto';
import { CreateNotificationDto } from '@/modules/notifications/dto/create-notification.dto';
import { NotificationService } from '@/modules/notifications/notification.service';
import { DocumentReminderService } from '@/common/document-reminder/document-reminder.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@Roles(UserRole.USER)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly documentReminderService: DocumentReminderService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification manually' })
  async create(
    @Req() req: Request & { user: IJwtPayload },
    @Body() dto: CreateNotificationDto,
  ) {
    const userId = req.user.sub;

    const notification = await this.notificationService.createNotification({
      userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
    });

    return {
      success: true,
      message: 'Notification created successfully',
      data: notification,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  async getAll(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;

    const notifications =
      await this.notificationService.getUserNotifications(userId);

    return {
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;

    const count = await this.notificationService.getUnreadCount(userId);

    return {
      success: true,
      message: 'Unread notification count fetched successfully',
      data: { count },
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;

    await this.notificationService.markAllAsRead(userId);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @Req() req: Request & { user: IJwtPayload },
    @Param('id') id: string,
  ) {
    const userId = req.user.sub;

    const notification = await this.notificationService.markAsRead(id, userId);

    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
    };
  }

  @Post('device-token')
  @ApiOperation({ summary: 'Register a device FCM token' })
  async registerDevice(
    @Req() req: Request & { user: IJwtPayload },
    @Body() dto: RegisterDeviceDto,
  ) {
    const userId = req.user.sub;

    const device = await this.notificationService.registerDevice(
      userId,
      dto.deviceToken,
      dto.platform,
    );

    return {
      success: true,
      message: 'Device token registered successfully',
      data: device,
    };
  }

  @Post('test-push')
  @ApiOperation({
    summary: 'Send a test Firebase push notification to all registered devices',
  })
  async testPush(@Req() req: Request & { user: IJwtPayload }) {
    const userId = req.user.sub;

    const result = await this.notificationService.sendNotificationToUser(
      userId,
      'Test Notification',
      'Firebase push notification is working!',
    );

    return {
      success: true,
      message: 'Push notification sent',
      data: result,
    };
  }
  @Post('test-reminder')
  @Public()
  @ApiOperation({
    summary: '[DEV] Manually trigger the document expiry reminder scheduler',
    description:
      'Runs the same logic as the daily 9 AM cron immediately. ' +
      'Use this to test reminder creation without waiting for the cron clock.',
  })
  @ApiResponse({ status: 201, description: 'Scheduler triggered.' })
  async testReminder() {
    await this.documentReminderService.triggerNow();

    return {
      success: true,
      message:
        'Document expiry reminder check triggered. Check server logs for details.',
    };
  }
}
