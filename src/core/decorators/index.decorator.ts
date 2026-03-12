import { addIndexMetadata } from "../metadata/metadata-storage";

/**
 * Decorator that defines a composite index on the table.
 * @param fields - Array of column names (snake_case) for the index
 * @example @Index(['email', 'tenant_id'])
 */
export function Index(fields: string[]): ClassDecorator {
  return (target: object): void => {
    if (typeof target !== "function") {
      throw new TypeError("@Index can only be applied to class constructors");
    }
    addIndexMetadata(target, fields);
  };
}
