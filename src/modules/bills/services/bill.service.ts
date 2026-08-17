import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction as SequelizeTransaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Bill } from '../schemas/bill.schema';
import { BillHistory } from '../../bill-history/schemas/bill-history.schema';
import { Transaction as TransactionModel } from '../../transactions/schemas/transaction.schema';
import { CreateBillDto } from '../dto/create-bill.dto';
import { UpdateBillDto } from '../dto/update-bill.dto';
import { PayBillDto } from '../dto/pay-bill.dto';
import { BillFilterDto } from '../dto/bill-filter.dto';
import { BillResponseDto } from '../dto/bill-response.dto';
import { BillMapper } from '../mapper/bill.mapper';
import { BillStatus } from '../enums/bill-status.enum';
import { RecurringType } from '../enums/recurring-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { BillHistoryStatus } from '../../bill-history/interfaces/bill-history.interface';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { WalletRepository } from '../../wallets/repositories/wallet.repository';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import { PaymentMethod as TxPaymentMethod } from '../../transactions/enums/payment-method.enum';

@Injectable()
export class BillService {
  constructor(
    @InjectModel(Bill)
    private readonly billModel: typeof Bill,
    private readonly billHistoryService: BillHistoryService,
    private readonly sequelize: Sequelize,
    private readonly cloudinaryService: CloudinaryService,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
  ) { }

  async create(userId: string, dto: CreateBillDto): Promise<BillResponseDto> {
    const bill = await this.billModel.create({
      userId,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
      amount: dto.amount,
      dueDate: dto.dueDate,
      isRecurring: dto.isRecurring,
      recurringType: dto.recurringType,
      reminderDaysBefore: dto.reminderDaysBefore,
      attachment: dto.attachment,
      notes: dto.notes,
      status: BillStatus.PENDING,
      paidAmount: 0,
      remainingAmount: dto.amount,
    });

    return BillMapper.toResponseDto(bill);
  }

  async findAll(
    userId: string,
    filter: BillFilterDto,
  ): Promise<{
    data: BillResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    await this.updateOverdueBills();

    const {
      page,
      limit,
      search,
      status,
      categoryId,
      isRecurring,
      dueFrom,
      dueTo,
      sortBy,
      sortOrder,
    } = filter;

    const todayStr = new Date().toISOString().split('T')[0];

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status === BillStatus.OVERDUE) {
      where[Op.or] = [
        { status: BillStatus.OVERDUE },
        {
          status: { [Op.in]: [BillStatus.PENDING, BillStatus.PARTIALLY_PAID] },
          dueDate: { [Op.lt]: todayStr },
        },
      ];
    } else if (status) {
      where.status = status;
    }

    if (categoryId) where.categoryId = categoryId;
    if (isRecurring !== undefined) where.isRecurring = isRecurring;

    if (dueFrom || dueTo) {
      const dueDateFilter: any = {};
      if (dueFrom) dueDateFilter[Op.gte] = dueFrom;
      if (dueTo) dueDateFilter[Op.lte] = dueTo;
      where.dueDate = dueDateFilter;
    }

    if (search) {
      const searchConditions = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];

      if (where[Op.or]) {
        where[Op.and] = [
          { [Op.or]: where[Op.or] },
          { [Op.or]: searchConditions },
        ];
        delete where[Op.or];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await this.billModel.findAndCountAll({
      where,
      include: [
        {
          model: BillHistory,
          as: 'paymentHistory',
          include: [
            {
              model: TransactionModel,
              as: 'transaction',
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    return {
      data: BillMapper.toResponseDtoList(rows),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }


  async findUpcoming(
    userId: string,
    days: number = 7,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: BillResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const offset = (page - 1) * limit;

    const { rows, count } = await this.billModel.findAndCountAll({
      where: {
        userId,
        deletedAt: null,
        status: {
          [Op.notIn]: [BillStatus.PAID, BillStatus.CANCELLED],
        },
        dueDate: {
          [Op.between]: [
            today.toISOString().split('T')[0],
            futureDate.toISOString().split('T')[0],
          ],
        },
      },
      include: [
        {
          model: BillHistory,
          as: 'paymentHistory',
          include: [
            {
              model: TransactionModel,
              as: 'transaction',
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [['dueDate', 'ASC']],
      limit,
      offset,
      distinct: true,
    });

    return {
      data: BillMapper.toResponseDtoList(rows),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<BillResponseDto> {
    const bill = await this.billModel.findOne({
      where: { id, deletedAt: null },
      include: [
        {
          model: BillHistory,
          as: 'paymentHistory',
          include: [
            {
              model: TransactionModel,
              as: 'transaction',
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [
        [{ model: BillHistory, as: 'paymentHistory' }, 'paymentDate', 'DESC'],
      ],
    });

    if (!bill) {
      throw new NotFoundException({
        success: false,
        message: 'Bill not found',
        errors: [],
      });
    }

    this.validateBillOwnership(bill, userId);

    return BillMapper.toResponseDto(bill);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateBillDto,
  ): Promise<BillResponseDto> {
    const bill = await this.billModel.findOne({
      where: { id, deletedAt: null },
    });

    if (!bill) {
      throw new NotFoundException({
        success: false,
        message: 'Bill not found',
        errors: [],
      });
    }

    this.validateBillOwnership(bill, userId);

    await bill.update(dto);

    return BillMapper.toResponseDto(bill);
  }

  async delete(userId: string, id: string): Promise<void> {
    const bill = await this.billModel.findOne({
      where: { id, deletedAt: null },
    });

    if (!bill) {
      throw new NotFoundException({
        success: false,
        message: 'Bill not found',
        errors: [],
      });
    }

    this.validateBillOwnership(bill, userId);

    if (bill.attachment?.publicId) {
      try {
        const mimeType = bill.attachment.mimeType || '';
        const resourceType: 'image' | 'raw' | 'video' =
          mimeType.startsWith('image/') || mimeType === 'application/pdf'
            ? 'image'
            : mimeType.startsWith('video/')
              ? 'video'
              : 'raw';
        await this.cloudinaryService.deleteFile(
          bill.attachment.publicId,
          resourceType,
        );
      } catch (error) {
        console.error('Failed to delete attachment from Cloudinary:', error);
      }
    }

    await bill.destroy();
  }

  async pay(
    userId: string,
    id: string,
    dto: PayBillDto,
  ): Promise<BillResponseDto> {
    const transaction = await this.sequelize.transaction({
      isolationLevel: SequelizeTransaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const bill = await this.billModel.findOne({
        where: { id, deletedAt: null },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!bill) {
        throw new NotFoundException({
          success: false,
          message: 'Bill not found',
          errors: [],
        });
      }

      this.validateBillOwnership(bill, userId);

      if (bill.status === BillStatus.PAID) {
        throw new ConflictException({
          success: false,
          message: 'Bill is already paid',
          errors: [],
        });
      }

      const currentPaidAmount = Number(bill.paidAmount) || 0;
      const billTotal = Number(bill.amount);
      const currentRemaining =
        bill.remainingAmount !== null && bill.remainingAmount !== undefined
          ? Number(bill.remainingAmount)
          : billTotal - currentPaidAmount;

      if (dto.amountPaid > currentRemaining) {
        throw new BadRequestException({
          success: false,
          message: 'Payment amount exceeds remaining bill amount',
          errors: [],
        });
      }

      const newPaidAmount = currentPaidAmount + dto.amountPaid;
      const newRemainingAmount = Math.max(0, billTotal - newPaidAmount);
      const isFullyPaid = newRemainingAmount === 0;
      const newStatus = isFullyPaid
        ? BillStatus.PAID
        : BillStatus.PARTIALLY_PAID;
      const historyStatus = isFullyPaid
        ? BillHistoryStatus.PAID
        : BillHistoryStatus.PARTIALLY_PAID;

      await bill.update(
        {
          status: newStatus,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paidDate: isFullyPaid
            ? new Date().toISOString().split('T')[0]
            : bill.paidDate,
          paymentMethod: dto.paymentMethod,
        },
        { transaction },
      );

      let createdTransaction: TransactionModel | null = null;

      if (dto.createTransaction) {
        const wallet = await this.walletRepository.findByUserIdForUpdate(
          userId,
          transaction,
        );

        if (!wallet) {
          throw new NotFoundException({
            success: false,
            message: 'Wallet not found for this user',
            errors: [],
          });
        }

        const currentBalance = Number(wallet.currentBalance);
        const blockedAmount = Number(wallet.blockedAmount);
        const availableBalance = currentBalance - blockedAmount;

        if (availableBalance < dto.amountPaid) {
          throw new BadRequestException({
            success: false,
            message: 'Insufficient wallet balance for bill payment',
            errors: [],
          });
        }

        await this.walletRepository.update(
          wallet.id,
          { currentBalance: currentBalance - dto.amountPaid } as Record<
            string,
            any
          >,
          transaction,
        );

        let txPaymentMethod: TxPaymentMethod;
        switch (dto.paymentMethod) {
          case PaymentMethod.CASH:
            txPaymentMethod = TxPaymentMethod.CASH;
            break;
          case PaymentMethod.UPI:
            txPaymentMethod = TxPaymentMethod.UPI;
            break;
          case PaymentMethod.BANK_TRANSFER:
            txPaymentMethod = TxPaymentMethod.BANK_TRANSFER;
            break;
          case PaymentMethod.CARD:
            txPaymentMethod = TxPaymentMethod.DEBIT_CARD;
            break;
          default:
            txPaymentMethod = TxPaymentMethod.CASH;
        }

        createdTransaction = await this.transactionRepository.create(
          userId,
          {
            wallet_id: wallet.id,
            category_id: bill.categoryId,
            type: TransactionType.EXPENSE,
            amount: dto.amountPaid,
            payment_method: txPaymentMethod,
            transaction_date: new Date().toISOString().split('T')[0],
            note: dto.remarks || `Bill payment: ${bill.title}`,
          },
          transaction,
        );
      }

      await this.billHistoryService.createHistory(
        {
          billId: bill.id,
          transactionId: createdTransaction?.id ?? null,
          amountPaid: dto.amountPaid,
          paymentMethod: dto.paymentMethod,
          status: historyStatus,
          remarks: dto.remarks,
        },
        transaction,
      );

      if (isFullyPaid && bill.isRecurring) {
        await this.generateNextRecurringBill(bill, transaction);
      }

      await transaction.commit();

      return BillMapper.toResponseDto(bill, {
        transactionId: createdTransaction?.id ?? null,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateNextRecurringBill(
    bill: Bill,
    transaction?: SequelizeTransaction,
  ): Promise<Bill> {
    const currentDueDate = new Date(bill.dueDate);
    let nextDueDate: Date;

    switch (bill.recurringType) {
      case RecurringType.DAILY:
        nextDueDate = new Date(currentDueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case RecurringType.WEEKLY:
        nextDueDate = new Date(currentDueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case RecurringType.MONTHLY:
        nextDueDate = new Date(currentDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case RecurringType.QUARTERLY:
        nextDueDate = new Date(currentDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        break;
      case RecurringType.HALF_YEARLY:
        nextDueDate = new Date(currentDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 6);
        break;
      case RecurringType.YEARLY:
        nextDueDate = new Date(currentDueDate);
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException({
          success: false,
          message: 'Invalid recurring type',
          errors: [],
        });
    }

    return this.billModel.create(
      {
        userId: bill.userId,
        categoryId: bill.categoryId,
        title: bill.title,
        description: bill.description,
        amount: bill.amount,
        dueDate: nextDueDate.toISOString().split('T')[0],
        isRecurring: bill.isRecurring,
        recurringType: bill.recurringType,
        reminderDaysBefore: bill.reminderDaysBefore,
        attachment: bill.attachment,
        notes: bill.notes,
        status: BillStatus.PENDING,
        paidAmount: 0,
        remainingAmount: bill.amount,
      },
      { transaction },
    );
  }

  validateBillOwnership(bill: Bill, userId: string): void {
    if (bill.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        message: 'You do not have access to this bill',
        errors: [],
      });
    }
  }

  async updateOverdueBills(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.billModel.update(
      { status: BillStatus.OVERDUE },
      {
        where: {
          status: BillStatus.PENDING,
          dueDate: { [Op.lt]: today },
          deletedAt: null,
        },
      },
    );
  }

  sendReminder(billId: string): void {
    console.log(`Sending reminder for bill ${billId}`);
  }
}
