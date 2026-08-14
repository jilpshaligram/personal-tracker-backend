import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Bill } from '../schemas/bill.schema';
import { CreateBillDto } from '../dto/create-bill.dto';
import { UpdateBillDto } from '../dto/update-bill.dto';
import { PayBillDto } from '../dto/pay-bill.dto';
import { BillFilterDto } from '../dto/bill-filter.dto';
import { BillResponseDto } from '../dto/bill-response.dto';
import { BillMapper } from '../mapper/bill.mapper';
import { BillStatus } from '../enums/bill-status.enum';
import { RecurringType } from '../enums/recurring-type.enum';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { BillHistoryStatus } from '../../bill-history/interfaces/bill-history.interface';

@Injectable()
export class BillService {
  constructor(
    @InjectModel(Bill)
    private readonly billModel: typeof Bill,
    private readonly billHistoryService: BillHistoryService,
    private readonly sequelize: Sequelize,
  ) {}

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
    });

    return BillMapper.toResponseDto(bill);
  }

  async findAll(
    userId: string,
    filter: BillFilterDto,
  ): Promise<{
    data: BillResponseDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
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

    // Use flexible typing for Sequelize where conditions with operators

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status === BillStatus.OVERDUE) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where[Op.or] = [
        { status: BillStatus.OVERDUE },
        {
          status: { [Op.in]: [BillStatus.PENDING, BillStatus.PARTIALLY_PAID] },
          dueDate: { [Op.lt]: todayStr },
        },
      ];
    } else if (status) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.status = status;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (categoryId) where.categoryId = categoryId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (isRecurring !== undefined) where.isRecurring = isRecurring;

    if (dueFrom || dueTo) {
      const dueDateFilter: Record<symbol, string> = {};
      if (dueFrom) dueDateFilter[Op.gte] = dueFrom;
      if (dueTo) dueDateFilter[Op.lte] = dueTo;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.dueDate = dueDateFilter;
    }

    if (search) {
      const searchConditions = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (where[Op.or]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where[Op.and] = [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          { [Op.or]: where[Op.or] },
          { [Op.or]: searchConditions },
        ];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete where[Op.or];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where[Op.or] = searchConditions;
      }
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await this.billModel.findAndCountAll({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
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
  ): Promise<{ data: BillResponseDto[]; pagination: any }> {
    await this.updateOverdueBills();

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
          [Op.notIn]: [
            BillStatus.PAID,
            BillStatus.CANCELLED,
            BillStatus.OVERDUE,
          ],
        },
        dueDate: {
          [Op.between]: [
            today.toISOString().split('T')[0],
            futureDate.toISOString().split('T')[0],
          ],
        },
      },
      order: [['dueDate', 'ASC']],
      limit,
      offset,
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

    await bill.destroy();
  }

  async pay(userId: string, id: string, dto: PayBillDto): Promise<void> {
    const transaction = await this.sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
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

      await bill.update(
        {
          status: BillStatus.PAID,
          paidDate: new Date().toISOString().split('T')[0],
          paymentMethod: dto.paymentMethod,
        },
        { transaction },
      );

      await this.billHistoryService.createHistory({
        billId: bill.id,
        amountPaid: dto.amountPaid,
        paymentMethod: dto.paymentMethod,
        status: BillHistoryStatus.PAID,
        remarks: dto.remarks,
      });

      if (bill.isRecurring) {
        await this.generateNextRecurringBill(bill, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateNextRecurringBill(
    bill: Bill,
    transaction?: Transaction,
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
    // Reminder logic placeholder - integrate with notification service
    console.log(`Sending reminder for bill ${billId}`);
  }
}
