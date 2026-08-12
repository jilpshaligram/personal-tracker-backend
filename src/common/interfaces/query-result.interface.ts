export interface QueryResult {
  where: Record<string, any>;

  order: any[];

  offset: number;

  limit: number;

  page: number;
}
