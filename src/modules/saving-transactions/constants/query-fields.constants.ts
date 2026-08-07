import { QueryOptions } from '../../../common/interfaces/query-options.interface';

export const SAVING_TRANSACTION_QUERY_FIELDS: QueryOptions = {
  searchableFields: ['type'],

  sortableFields: ['amount', 'type', 'createdAt', 'updatedAt'],

  filterableFields: ['type', 'savingGoalId', 'userId'],

  defaultSortBy: 'createdAt',

  defaultSortOrder: 'DESC',
};
