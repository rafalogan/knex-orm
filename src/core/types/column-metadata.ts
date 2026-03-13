/**
 * Supported column types for Knex Schema Builder.
 * Maps to table.string(), table.integer(), etc.
 */
export type ColumnType =
  | 'string'
  | 'integer'
  | 'bigInteger'
  | 'boolean'
  | 'text'
  | 'float'
  | 'decimal'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'jsonb'
  | 'uuid';

/**
 * Metadata for a single column/property of an entity.
 */
export interface ColumnMetadata {
  columnName: string;
  type: ColumnType;
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  index?: boolean;
}

/**
 * Options for @Column decorator.
 */
export interface ColumnOptions {
  type: ColumnType;
  nullable?: boolean;
  default?: unknown;
  unique?: boolean;
  index?: boolean;
}

/**
 * Options for @PrimaryKey decorator.
 */
export interface PrimaryKeyOptions {
  autoincrement?: boolean;
  uuid?: boolean;
}
