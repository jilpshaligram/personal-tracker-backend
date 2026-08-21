import { UserRole } from '@/modules/users/enums/user-role.enum';
import { UserStatus } from '@/modules/users/enums/user-status.enum';
import { Gender } from '@/modules/users/enums/gender.enum';

export type SortOrder = 'ASC' | 'DESC';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  gender?: Gender;
  isVerified?: boolean;
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
