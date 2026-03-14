/**
 * Options for paginated queries.
 */
export interface PaginateOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Result of a paginated query.
 */
export interface PaginateResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Options for findMany query.
 */
export interface FindManyOptions<T> {
  where?: Partial<T>;
  limit?: number;
  offset?: number;
  orderBy?: keyof T | string;
  order?: 'asc' | 'desc';
}

/**
 * Filter for updateMany/deleteMany by primary key ids.
 */
export interface IdsFilter {
  ids: (string | number)[];
}
