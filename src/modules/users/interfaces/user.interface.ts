export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isVerified: boolean;
  isPinCreated: boolean;
  profileImage: string | null;
  dateOfBirth: string;
  gender: string;
  notificationEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
