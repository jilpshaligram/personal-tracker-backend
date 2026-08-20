import { Op, Order, WhereOptions } from 'sequelize';

import { QueryDto } from '../dto/query.dto';
import { QueryOptions } from '../interfaces/query-options.interface';
import { QueryResult } from '../interfaces/query-result.interface';

export class QueryHelper {
  static build(query: QueryDto, options: QueryOptions): QueryResult {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
    } = query;

    const where: WhereOptions = {};

    // SEARCH

    if (search && options.searchableFields && options.searchableFields.length) {
      Object.assign(where, {
        [Op.or]: options.searchableFields.map((field) => ({
          [field]: {
            [Op.iLike]: `%${search}%`,
          },
        })),
      });
    }

    // FILTERS

    if (options.filterableFields) {
      for (const field of options.filterableFields) {
        const value = (query as unknown as Record<string, unknown>)[field];

        if (value !== undefined && value !== null && value !== '') {
          (where as Record<string, unknown>)[field] = value;
        }
      }
    }

    // DATE RANGE

    if (startDate || endDate) {
      const createdAtFilter: Record<symbol, Date> = {};

      if (startDate) {
        createdAtFilter[Op.gte] = new Date(startDate);
      }

      if (endDate) {
        createdAtFilter[Op.lte] = new Date(endDate);
      }

      const dateField = options.dateField ?? 'createdAt';

      (where as Record<string, unknown>)[dateField] = createdAtFilter;
    }

    // SORTING

    let order: Order = [
      [
        options.defaultSortBy ?? 'createdAt',
        options.defaultSortOrder ?? 'DESC',
      ],
    ];

    if (sortBy && options.sortableFields?.includes(sortBy)) {
      order = [[sortBy, (sortOrder ?? 'DESC').toUpperCase() as 'ASC' | 'DESC']];
    }

    // PAGINATION

    const offset = (page - 1) * limit;

    return {
      where,
      order,
      offset,
      limit,
      page,
    };
  }
}
