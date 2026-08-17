import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Gender } from '../enums/gender.enum';

export type SortOrder = 'ASC' | 'DESC';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  /** Searches firstName, lastName, email, phone */
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  gender?: Gender;
  isVerified?: boolean;
  /** Column name (whitelist-guarded inside service) */
  sortBy?: string;
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
