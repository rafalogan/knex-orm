import type { ColumnOptions } from '../types/column-metadata';
import { addColumnMetadata } from '../metadata/metadata-storage';
import { getPrototypeConstructor, toSnakeCase } from '../utils/string';

/**
 * Decorator that defines a column of an entity.
 * Column name is derived from property name in snake_case.
 * @param options - type (required), nullable, default, unique, index
 * @example @Column({ type: 'string', nullable: false }) email: string;
 */
export function Column(options: ColumnOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const constructor = getPrototypeConstructor(target);
    if (!constructor) return;

    const propertyName = String(propertyKey);
    const columnName = toSnakeCase(propertyName);

    addColumnMetadata(constructor, propertyName, {
      columnName,
      type: options.type,
      ...(options.nullable !== undefined && { nullable: options.nullable }),
      ...(options.default !== undefined && { default: options.default }),
      ...(options.unique !== undefined && { unique: options.unique }),
      ...(options.index !== undefined && { index: options.index }),
    });
  };
}
