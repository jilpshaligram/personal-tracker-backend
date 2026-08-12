import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, OrderItem } from 'sequelize';
import { User } from '../schemas/user.schema';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Gender } from '../enums/gender.enum';
import { IUser } from '../interfaces/user.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

export type SortOrder = 'ASC' | 'DESC';

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLoginAt: 'lastLoginAt',
};

export interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string; // searches firstName, lastName, email, phone
  role?: UserRole;
  status?: UserStatus;
  gender?: Gender;
  isVerified?: boolean;
  sortBy?: string; // column name (whitelist-guarded)
  sortOrder?: SortOrder;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  password: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async create(data: CreateUserData): Promise<User> {
    return this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      password: data.password,
      role: UserRole.USER,
      status: UserStatus.PENDING,
      isVerified: false,
      isPinCreated: false,
      notificationEnabled: true,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async findAll(
    options: FindAllOptions = {},
  ): Promise<{ rows: User[]; count: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      gender,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;

    // ── WHERE clause ─────────────────────────────────────────────────────────
    const where: WhereOptions = {};

    // Full-text search across firstName, lastName, email, phone
    if (search && search.trim()) {
      const like = { [Op.like]: `%${search.trim()}%` };
      (where as Record<symbol, unknown>)[Op.or] = [
        { firstName: like },
        { lastName: like },
        { email: like },
        { phone: like },
      ];
    }

    // Exact filters
    if (role) where['role'] = role;
    if (status) where['status'] = status;
    if (gender) where['gender'] = gender;
    if (isVerified !== undefined) where['isVerified'] = isVerified;

    // ── ORDER clause ─────────────────────────────────────────────────────────
    const safeColumn = ALLOWED_SORT_COLUMNS[sortBy] ?? 'createdAt';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const order: OrderItem[] = [[safeColumn, safeOrder]];

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      limit,
      offset,
      order,
    });

    return { rows, count };
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }
    await this.userModel.update(data, { where: { id } });
    return (await this.userModel.findByPk(id)) as User;
  }

  async softDeleteUser(id: string): Promise<void> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }
    await user.destroy(); // paranoid: true → sets deletedAt
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userModel.update(
      { isVerified: true, status: UserStatus.EMAIL_VERIFIED },
      { where: { id: userId } },
    );
  }

  async markPhoneVerified(userId: string): Promise<void> {
    await this.userModel.update(
      { isVerified: true, status: UserStatus.PHONE_VERIFIED },
      { where: { id: userId } },
    );
  }

  async setPin(userId: string, hashedPin: string): Promise<void> {
    await this.userModel.update(
      {
        pin: hashedPin,
        isPinCreated: true,
        status: UserStatus.ACTIVE,
        wrongPinAttempts: 0,
      },
      { where: { id: userId } },
    );
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.update(
      { password: hashedPassword, lastPasswordChangedAt: new Date() },
      { where: { id: userId } },
    );
  }

  async updatePin(userId: string, hashedPin: string): Promise<void> {
    await this.userModel.update(
      { pin: hashedPin, wrongPinAttempts: 0 },
      { where: { id: userId } },
    );
  }

  async incrementWrongPinAttempts(userId: string): Promise<number> {
    const user = await this.userModel.findByPk(userId);
    if (!user) return 0;
    const newCount = (user.wrongPinAttempts ?? 0) + 1;
    const updateData: Partial<{
      wrongPinAttempts: number;
      pinLockedUntil: Date;
    }> = { wrongPinAttempts: newCount };
    if (newCount >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      updateData.pinLockedUntil = lockUntil;
    }
    await this.userModel.update(updateData, { where: { id: userId } });
    return newCount;
  }

  async resetPinAttempts(userId: string): Promise<void> {
    await this.userModel.update(
      { wrongPinAttempts: 0, pinLockedUntil: null, lastLoginAt: new Date() },
      { where: { id: userId } },
    );
  }

  toSafeUser(user: User): IUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      isPinCreated: user.isPinCreated,
      profileImage: user.profileImage,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      notificationEnabled: user.notificationEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
