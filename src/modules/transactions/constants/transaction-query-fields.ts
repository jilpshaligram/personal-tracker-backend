import { QueryOptions } from '@/common/interfaces/query-options.interface';

export const TRANSACTION_QUERY_FIELDS: QueryOptions = {
  searchableFields: [],

  sortableFields: [
    'amount',
    'transactionDate',
    'createdAt',
    'updatedAt',
    'type',
    'categoryName',
    'currentBalance',
    'blockedAmount',
    'availableBalance',
    'savingGoalTitle',
    'paymentMethod',
    'note',
  ],

  filterableFields: ['paymentMethod'],

  defaultSortBy: 'transactionDate',
  defaultSortOrder: 'DESC',
  dateField: 'transaction_date',
};
