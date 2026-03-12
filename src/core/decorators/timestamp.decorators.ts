import {
  addColumnMetadata,
  setSoftDeleteMetadata,
} from "../metadata/metadata-storage";
import { toSnakeCase } from "../utils/string";

/**
 * Decorator for created_at column with default CURRENT_TIMESTAMP.
 * Property name must be createdAt; column becomes created_at.
 * @example @CreatedAt() createdAt: Date;
 */
export function CreatedAt(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const propertyName = String(propertyKey);
    const columnName = toSnakeCase(propertyName);
    const constructor = (target as { constructor?: object }).constructor;
    if (!constructor) return;

    addColumnMetadata(constructor, propertyName, {
      columnName,
      type: "timestamp",
      default: "CURRENT_TIMESTAMP",
    });
  };
}

/**
 * Decorator for updated_at column with default CURRENT_TIMESTAMP.
 * Property name must be updatedAt; column becomes updated_at.
 * @example @UpdatedAt() updatedAt: Date;
 */
export function UpdatedAt(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const propertyName = String(propertyKey);
    const columnName = toSnakeCase(propertyName);
    const constructor = (target as { constructor?: object }).constructor;
    if (!constructor) return;

    addColumnMetadata(constructor, propertyName, {
      columnName,
      type: "timestamp",
      default: "CURRENT_TIMESTAMP",
    });
  };
}

/**
 * Decorator for deleted_at column (soft delete).
 * Enables disable() in repository. Column is nullable.
 * @example @SoftDelete() deletedAt?: Date;
 */
export function SoftDelete(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const propertyName = String(propertyKey);
    const columnName = toSnakeCase(propertyName);
    const constructor = (target as { constructor?: object }).constructor;
    if (!constructor) return;

    addColumnMetadata(constructor, propertyName, {
      columnName,
      type: "timestamp",
      nullable: true,
    });
    setSoftDeleteMetadata(constructor, propertyName, columnName);
  };
}
