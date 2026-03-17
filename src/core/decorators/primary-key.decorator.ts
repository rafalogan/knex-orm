import type { PrimaryKeyOptions } from '../types/column-metadata';
import { setPrimaryKeyMetadata } from '../metadata/metadata-storage';
import { getPrototypeConstructor, toSnakeCase } from '../utils/string';
import { assertValidSqlIdentifier } from '../security/identifier';

/**
 * Decorator that defines the primary key of an entity.
 * Column name is derived from property name in snake_case.
 * @param options - Optional: autoincrement, uuid
 * @example @PrimaryKey() id: number;
 * @example @PrimaryKey({ uuid: true }) id: string;
 */
export function PrimaryKey(options?: PrimaryKeyOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const constructor = getPrototypeConstructor(target);
    if (!constructor) return;

    const propertyName = String(propertyKey);
    const columnName = toSnakeCase(propertyName);
    assertValidSqlIdentifier(columnName, `@PrimaryKey for "${propertyName}"`);
    setPrimaryKeyMetadata(constructor, propertyName, columnName, options);
  };
}
