import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { BillService } from './bill.service';
import { Bill } from '../schemas/bill.schema';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { WalletRepository } from '../../wallets/repositories/wallet.repository';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { BillStatus } from '../enums/bill-status.enum';

describe('BillService', () => {
  let service: BillService;

  const mockBillModel = {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockUser = {
    sub: 'user-uuid-123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillService,
        { provide: getModelToken(Bill), useValue: mockBillModel },
        { provide: BillHistoryService, useValue: { createHistory: jest.fn() } },
        {
          provide: WalletRepository,
          useValue: { findByUserIdForUpdate: jest.fn(), update: jest.fn() },
        },
        { provide: TransactionRepository, useValue: { create: jest.fn() } },
        { provide: Sequelize, useValue: { transaction: jest.fn() } },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<BillService>(BillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a bill and return response DTO', async () => {
      const dto = {
        categoryId: 'cat-123',
        title: 'Internet Bill',
        amount: 80,
        dueDate: '2026-09-01',
        isRecurring: false,
        reminderDaysBefore: [1],
      };

      const createdBill = {
        id: 'bill-1',
        userId: mockUser.sub,
        ...dto,
        status: BillStatus.PENDING,
        amount: 80,
        paidDate: null,
        paymentMethod: null,
        recurringType: null,
        lastReminderSentAt: null,
        attachment: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBillModel.create.mockResolvedValue(createdBill);

      const result = await service.create(mockUser.sub, dto);
      expect(result.id).toBe('bill-1');
      expect(result.title).toBe('Internet Bill');

      const createSpy = mockBillModel.create;
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if bill does not exist', async () => {
      mockBillModel.findOne.mockResolvedValue(null);

      await expect(service.delete(mockUser.sub, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if bill belongs to another user', async () => {
      mockBillModel.findOne.mockResolvedValue({
        id: 'bill-1',
        userId: 'other-user',
      });

      await expect(service.delete(mockUser.sub, 'bill-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete bill and remove Cloudinary attachment if present', async () => {
      const destroyMock = jest.fn().mockResolvedValue(true);
      const mockBill = {
        id: 'bill-1',
        userId: mockUser.sub,
        attachment: {
          publicId: 'bills/bill_attachment_id',
        },
        destroy: destroyMock,
      };

      mockBillModel.findOne.mockResolvedValue(mockBill);

      await service.delete(mockUser.sub, 'bill-1');

      const deleteSpy = mockCloudinaryService.deleteFile;
      expect(deleteSpy).toHaveBeenCalledWith(
        'bills/bill_attachment_id',
        'auto',
      );
      expect(destroyMock).toHaveBeenCalled();
    });
  });

  describe('findAll with status OVERDUE', () => {
    it('should fetch overdue bills via status filter and auto update pending past-due status', async () => {
      mockBillModel.update = jest.fn().mockResolvedValue([0]);
      mockBillModel.findAndCountAll.mockResolvedValue({
        rows: [
          {
            id: 'overdue-1',
            userId: mockUser.sub,
            title: 'Overdue Electricity',
            amount: 100,
            dueDate: '2026-08-01',
            status: BillStatus.OVERDUE,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        count: 1,
      });

      const filter = {
        page: 1,
        limit: 1,
        status: BillStatus.OVERDUE,
        sortBy: 'dueDate' as const,
        sortOrder: 'ASC' as const,
      };

      const result = await service.findAll(mockUser.sub, filter);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('overdue-1');
      expect(mockBillModel.update).toHaveBeenCalled();
      expect(mockBillModel.findAndCountAll).toHaveBeenCalled();
    });
  });
});
