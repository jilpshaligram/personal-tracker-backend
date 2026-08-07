import { QueryOptions } from '../../../common/interfaces/query-options.interface';

export const DOCUMENT_QUERY_FIELDS: QueryOptions = {
  searchableFields: ['title'],

  sortableFields: [
    'title',
    'expiryDate',
    'createdAt',
    'updatedAt',
    'reminderDaysBefore',
  ],

  filterableFields: ['categoryId', 'reminderDaysBefore', 'expiryDate'],

  defaultSortBy: 'createdAt',
  defaultSortOrder: 'DESC',
};
