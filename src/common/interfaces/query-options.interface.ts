export interface QueryOptions {
  searchableFields?: string[];

  sortableFields?: string[];

  filterableFields?: string[];

  defaultSortBy?: string;

  defaultSortOrder?: 'ASC' | 'DESC';
}
