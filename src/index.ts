// Decorators
export {
  Entity,
  Column,
  PrimaryKey,
  CreatedAt,
  UpdatedAt,
  getEntityMetadata,
} from '@core/decorators';

// Metadata / types
export type { EntityMetadata } from '@core/types/entity-metadata';
export type { ColumnMetadata, ColumnOptions } from '@core/types/column-metadata';

// Repository
export { Repository } from '@adapters/repository';
export type {
  PaginateOptions,
  PaginateResult,
  FindManyOptions,
  FindOptions,
  WhereClause,
  IdsFilter,
} from '@adapters/repository';

// Migration engine
export {
  MigrationEngine,
  SchemaBuilder,
  SchemaDiff,
  SchemaRegistry,
  MigrationGenerator,
  MigrationWriter,
} from '@adapters/migration';
export { EntityScanner } from '@core/metadata/entity-scanner';
export type { GenerateOptions, GenerateResult, MigrationOp, OrmSchema } from '@adapters/migration';

// Knex adapter
export { KnexAdapter } from '@adapters/knex';
