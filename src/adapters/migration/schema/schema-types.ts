import type { ColumnType } from '@core/types/column-metadata';

/**
 * Schema de coluna serializável (para diff e migrations).
 */
export interface ColumnSchema {
  columnName: string;
  type: ColumnType;
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  index?: boolean;
}

/**
 * Schema de tabela (estado conhecido do banco).
 */
export interface TableSchema {
  tableName: string;
  columns: Record<string, ColumnSchema>;
  primaryKey?: { columnName: string; autoincrement?: boolean };
  indexes?: Array<{ fields: string[]; name?: string }>;
}

/**
 * Schema completo do ORM (todas as tabelas).
 */
export interface OrmSchema {
  version: number;
  tables: Record<string, TableSchema>;
  generatedAt?: string;
}
