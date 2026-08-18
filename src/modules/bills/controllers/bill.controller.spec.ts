
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import type { UploadApiResponse } from 'cloudinary';
import { BillController } from './bill.controller';
import { BillService } from '../services/bill.service';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { BillStatus } from '../enums/bill-status.enum';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

jest.mock('../../../common/guards/auth.guard', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

describe('BillController', () => {
  let controller: BillController;
  let billService: jest.Mocked<BillService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockUser: IJwtPayload = {
    sub: 'user-uuid-123',
    email: 'test@example.com',
    role: 'USER',
    tokenType: 'access',
  };

  let mockReq: AuthenticatedRequest;

  beforeEach(async () => {
    mockReq = {
      user: mockUser,
      body: {},
    } as unknown as AuthenticatedRequest;

    const mockBillService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findUpcoming: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      pay: jest.fn(),
    };

    const mockBillHistoryService = {
      findByBill: jest.fn(),
    };

    const mockCloudinaryService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillController],
      providers: [
        { provide: BillService, useValue: mockBillService },
        { provide: BillHistoryService, useValue: mockBillHistoryService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BillController>(BillController);
    billService = module.get(BillService);
    cloudinaryService = module.get(CloudinaryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a bill without file attachment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDateStr = tomorrow.toISOString().split('T')[0];

      mockReq.body = {
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Electricity Bill',
        amount: 150,
        dueDate: dueDateStr,
        reminderDaysBefore: [1, 3],
      };

      billService.create.mockResolvedValue({
        id: 'bill-1',
        userId: mockUser.sub,
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Electricity Bill',
        description: null,
        amount: 150,
        dueDate: dueDateStr,
        paidDate: null,
        paymentMethod: null,
        status: BillStatus.PENDING,
        isRecurring: false,
        recurringType: null,
        reminderDaysBefore: [1, 3],
        lastReminderSentAt: null,
        attachment: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.create(mockReq);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Bill created successfully');

      expect(billService.create).toHaveBeenCalled();
    });

    it('should upload attachment and create bill when file is uploaded', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDateStr = tomorrow.toISOString().split('T')[0];

      mockReq.body = {
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Water Bill',
        amount: 50,
        dueDate: dueDateStr,
        reminderDaysBefore: ['1', '7'],
      };

      const mockFile = {
        originalname: 'bill.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const uploadResult = {
        secure_url: 'https://cloudinary.com/bill.pdf',
        public_id: 'bills/bill123',
      } as UploadApiResponse;

      cloudinaryService.uploadFile.mockResolvedValue(uploadResult);

      billService.create.mockResolvedValue({
        id: 'bill-2',
        userId: mockUser.sub,
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Water Bill',
        description: null,
        amount: 50,
        dueDate: dueDateStr,
        paidDate: null,
        paymentMethod: null,
        status: BillStatus.PENDING,
        isRecurring: false,
        recurringType: null,
        reminderDaysBefore: [1, 7],
        lastReminderSentAt: null,
        attachment: {
          url: 'https://cloudinary.com/bill.pdf',
          publicId: 'bills/bill123',
          fileName: 'bill.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        },
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.create(mockReq, mockFile);
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'bills',
      );
      expect(result.success).toBe(true);

      const attachment = (result.data as { attachment: { publicId: string } })
        .attachment;
      expect(attachment.publicId).toBe('bills/bill123');
    });

    it('should throw BadRequestException if validation fails', async () => {
      mockReq.body = {
        title: 'A',
        amount: -10,
      };

      await expect(controller.create(mockReq)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update bill and clean up old attachment when uploading a new one', async () => {
      const billId = 'bill-123';
      mockReq.body = {
        title: 'Updated Title',
      };

      billService.findOne.mockResolvedValue({
        id: billId,
        userId: mockUser.sub,
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Old Title',
        description: null,
        amount: 100,
        dueDate: '2026-09-01',
        paidDate: null,
        paymentMethod: null,
        status: BillStatus.PENDING,
        isRecurring: false,
        recurringType: null,
        reminderDaysBefore: [],
        lastReminderSentAt: null,
        attachment: {
          url: 'https://cloudinary.com/old.pdf',
          publicId: 'bills/old_public_id',
          fileName: 'old.pdf',
          mimeType: 'application/pdf',
          size: 512,
        },
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockFile = {
        originalname: 'new.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        buffer: Buffer.from('new content'),
      } as Express.Multer.File;

      const uploadResult = {
        secure_url: 'https://cloudinary.com/new.pdf',
        public_id: 'bills/new_public_id',
      } as UploadApiResponse;

      cloudinaryService.uploadFile.mockResolvedValue(uploadResult);

      billService.update.mockResolvedValue({
        id: billId,
        userId: mockUser.sub,
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Updated Title',
        description: null,
        amount: 100,
        dueDate: '2026-09-01',
        paidDate: null,
        paymentMethod: null,
        status: BillStatus.PENDING,
        isRecurring: false,
        recurringType: null,
        reminderDaysBefore: [],
        lastReminderSentAt: null,
        attachment: {
          url: 'https://cloudinary.com/new.pdf',
          publicId: 'bills/new_public_id',
          fileName: 'new.pdf',
          mimeType: 'application/pdf',
          size: 2048,
        },
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.update(mockReq, billId, mockFile);

      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith(
        'bills/old_public_id',
        'auto',
      );
      expect(cloudinaryService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'bills',
      );
      expect(result.success).toBe(true);

      const data = result.data as { title: string };
      expect(data.title).toBe('Updated Title');
    });
  });
});
