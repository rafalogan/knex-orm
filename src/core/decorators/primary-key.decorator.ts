import type { PrimaryKeyOptions } from "../types/column-metadata";
import { setPrimaryKeyMetadata } from "../metadata/metadata-storage";
import { toSnakeCase } from "../utils/string";

/**
 * Decorator that defines the primary key of an entity.
 * Column name is derived from property name in snake_case.
 * @param options - Optional: autoincrement, uuid
 * @example @PrimaryKey() id: number;
 * @example @PrimaryKey({ uuid: true }) id: string;
 */
export function PrimaryKey(options?: PrimaryKeyOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const propertyName = String(propertyKey);
    const columnName = toSnakeCase(propertyName);
    const constructor = (target as { constructor?: object }).constructor;
    if (!constructor) return;
    setPrimaryKeyMetadata(constructor, propertyName, columnName, options);
  };
}
