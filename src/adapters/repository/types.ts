/**
 * Where clause com operadores opcionais ($eq, $ne, $in, $like).
 * Valor direto = igualdade. Objeto com operador = condição específica.
 */
export type WhereClause<T> = {
  [K in keyof T]?: T[K] | { $eq?: T[K]; $ne?: T[K]; $in?: Array<T[K]>; $like?: string };
};

/**
 * Opções para find() conforme documentação IRepository.
 */
export interface FindOptions<T> {
  select?: Array<keyof T>;
  where?: WhereClause<T>;
  orderBy?: Partial<Record<keyof T, 'asc' | 'desc'>>;
  limit?: number;
  offset?: number;
  withDeleted?: boolean;
}

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
