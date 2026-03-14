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
import type { Repository } from '@adapters/repository';
export type IRepository<T extends Record<string, unknown> = Record<string, unknown>> = Repository<T>;
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

// Connection management
export {
  KnexORM,
  ConnectionManager,
  ConnectionConfigLoader,
  ConnectionFactory,
  ConnectionRegistry,
} from '@adapters/connection';
export type {
  OrmConfig,
  OrmConfigModule,
  ConnectionEntry,
} from '@adapters/connection';
