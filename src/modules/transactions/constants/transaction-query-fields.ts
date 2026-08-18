import { QueryOptions } from '../../../common/interfaces/query-options.interface';

export const TRANSACTION_QUERY_FIELDS: QueryOptions = {
  // We do NOT use searchableFields because the generic query.helper.ts applies Op.iLike to them,
  // which causes PostgreSQL type errors when applied to numeric or enum columns (e.g. amount, type).
  // Searching is implemented manually in the transaction.repository.ts
  searchableFields: [],

  // Supported explicit sorts. We also intercept custom complex sorts (e.g. availableBalance) in repository.
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

  // Generic exact-match filtering allowed by query.helper.ts.
  // 'type' and 'category' are handled manually because of 'ALL' and join requirements.
  filterableFields: ['paymentMethod'],

  defaultSortBy: 'transactionDate',
  defaultSortOrder: 'DESC',
};
