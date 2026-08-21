import { SavingTransactionType } from '@/modules/saving-transactions/enums/saving-transaction-type.enum';

export interface ISavingTransaction {
  id: string;
  savingGoalId: string;
  userId: string;
  type: SavingTransactionType;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
