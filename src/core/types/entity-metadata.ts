import type { ColumnMetadata, PrimaryKeyOptions } from './column-metadata';

/**
 * Metadata stored for an entity class decorated with @Entity.
 */
export interface EntityMetadata {
  tableName: string;
  columns?: Record<string, ColumnMetadata>;
  primaryKey?: {
    propertyName: string;
    columnName: string;
    options?: PrimaryKeyOptions;
  };
  softDelete?: {
    propertyName: string;
    columnName: string;
  };
  indexes?: Array<{ fields: string[] }>;
}
