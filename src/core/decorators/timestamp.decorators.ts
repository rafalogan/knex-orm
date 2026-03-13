import type { ColumnMetadata } from '../types/column-metadata';
import { addColumnMetadata, setSoftDeleteMetadata } from '../metadata/metadata-storage';
import { getPrototypeConstructor, toSnakeCase } from '../utils/string';

function createTimestampDecorator(
  metadata: Omit<ColumnMetadata, 'columnName'> & { columnName?: string },
  onApply?: (constructor: object, propertyName: string, columnName: string) => void,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const constructor = getPrototypeConstructor(target);
    if (!constructor) return;

    const propertyName = String(propertyKey);
    const columnName = metadata.columnName ?? toSnakeCase(propertyName);

    addColumnMetadata(constructor, propertyName, {
      ...metadata,
      columnName,
    });
    onApply?.(constructor, propertyName, columnName);
  };
}

/**
 * Decorator for created_at column with default CURRENT_TIMESTAMP.
 * Property name must be createdAt; column becomes created_at.
 * @example @CreatedAt() createdAt: Date;
 */
export function CreatedAt(): PropertyDecorator {
  return createTimestampDecorator({
    type: 'timestamp',
    default: 'CURRENT_TIMESTAMP',
  });
}

/**
 * Decorator for updated_at column with default CURRENT_TIMESTAMP.
 * Property name must be updatedAt; column becomes updated_at.
 * @example @UpdatedAt() updatedAt: Date;
 */
export function UpdatedAt(): PropertyDecorator {
  return createTimestampDecorator({
    type: 'timestamp',
    default: 'CURRENT_TIMESTAMP',
  });
}

/**
 * Decorator for deleted_at column (soft delete).
 * Enables disable() in repository. Column is nullable.
 * @example @SoftDelete() deletedAt?: Date;
 */
export function SoftDelete(): PropertyDecorator {
  return createTimestampDecorator({ type: 'timestamp', nullable: true }, (constructor, propertyName, columnName) => {
    setSoftDeleteMetadata(constructor, propertyName, columnName);
  });
}
