import type {
  ColumnMetadata,
  PrimaryKeyOptions,
} from "../types/column-metadata";
import type { EntityMetadata } from "../types/entity-metadata";

const entityRegistry = new Map<object, Pick<EntityMetadata, "tableName">>();
const columnRegistry = new Map<object, Map<string, ColumnMetadata>>();
const primaryKeyRegistry = new Map<
  object,
  { propertyName: string; columnName: string; options?: PrimaryKeyOptions }
>();
const softDeleteRegistry = new Map<
  object,
  { propertyName: string; columnName: string }
>();
const indexRegistry = new Map<object, Array<{ fields: string[] }>>();

/**
 * Stores entity metadata for a class. Used internally by @Entity decorator.
 */
export function setEntityMetadata(
  target: object,
  metadata: Pick<EntityMetadata, "tableName">,
): void {
  entityRegistry.set(target, metadata);
}

/**
 * Adds column metadata for a property. Used by @Column and related decorators.
 */
export function addColumnMetadata(
  constructor: object,
  propertyName: string,
  metadata: ColumnMetadata,
): void {
  let columns = columnRegistry.get(constructor);
  if (!columns) {
    columns = new Map();
    columnRegistry.set(constructor, columns);
  }
  columns.set(propertyName, metadata);
}

/**
 * Sets primary key metadata. Used by @PrimaryKey decorator.
 */
export function setPrimaryKeyMetadata(
  constructor: object,
  propertyName: string,
  columnName: string,
  options?: PrimaryKeyOptions,
): void {
  primaryKeyRegistry.set(constructor, {
    propertyName,
    columnName,
    ...(options && Object.keys(options).length > 0 && { options }),
  });
}

/**
 * Sets soft delete metadata. Used by @SoftDelete decorator.
 */
export function setSoftDeleteMetadata(
  constructor: object,
  propertyName: string,
  columnName: string,
): void {
  softDeleteRegistry.set(constructor, { propertyName, columnName });
}

/**
 * Adds index metadata. Used by @Index decorator.
 */
export function addIndexMetadata(constructor: object, fields: string[]): void {
  const existing = indexRegistry.get(constructor) ?? [];
  indexRegistry.set(constructor, [...existing, { fields }]);
}

/**
 * Retrieves entity metadata for a class, if it was decorated with @Entity.
 * Merges base entity metadata with columns, primaryKey, softDelete, and indexes.
 */
export function getEntityMetadata(target: object): EntityMetadata | undefined {
  const base = entityRegistry.get(target);
  if (!base) return undefined;

  const columnsMap = columnRegistry.get(target);
  const columns: Record<string, ColumnMetadata> = {};
  if (columnsMap) {
    for (const [key, value] of columnsMap) {
      columns[key] = value;
    }
  }

  const primaryKey = primaryKeyRegistry.get(target);
  const softDelete = softDeleteRegistry.get(target);
  const indexes = indexRegistry.get(target);

  return {
    ...base,
    ...(Object.keys(columns).length > 0 && { columns }),
    ...(primaryKey && { primaryKey }),
    ...(softDelete && { softDelete }),
    ...(indexes && indexes.length > 0 && { indexes }),
  };
}
