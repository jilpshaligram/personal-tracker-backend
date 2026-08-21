import { QueryOptions } from '@/common/interfaces/query-options.interface';

export const DOCUMENT_CATEGORY_QUERY_FIELDS: QueryOptions = {
  searchableFields: ['name'],

  sortableFields: ['name', 'status', 'createdAt', 'updatedAt'],

  filterableFields: ['status'],

  defaultSortBy: 'createdAt',

  defaultSortOrder: 'DESC',
};
