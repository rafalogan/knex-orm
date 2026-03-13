import type { EntityMetadata } from '../types/entity-metadata';
import { setEntityMetadata, getEntityMetadata as getFromStorage } from '../metadata/metadata-storage';
import { toSnakeCase } from '../utils/string';

/**
 * Decorator that maps a class to a database table.
 * @param tableName - Optional custom table name. If omitted, derived from class name in snake_case.
 */
export function Entity(tableName?: string): ClassDecorator {
  return (target: object): void => {
    if (typeof target !== 'function') {
      throw new TypeError('@Entity can only be applied to class constructors');
    }

    const constructor = target as new (...args: unknown[]) => object;
    const name = constructor.name ?? '';
    const resolvedTableName = tableName ?? toSnakeCase(name);

    setEntityMetadata(target, { tableName: resolvedTableName });
  };
}

/**
 * Returns entity metadata for a class, if it was decorated with @Entity.
 */
export function getEntityMetadata(target: object): EntityMetadata | undefined {
  return getFromStorage(target);
}
