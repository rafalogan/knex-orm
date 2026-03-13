/**
 * Converts PascalCase/camelCase to snake_case.
 * @example "User" -> "user", "createdAt" -> "created_at"
 */
export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, (_, letter: string) => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

/**
 * Gets the class constructor from a property decorator target.
 * For instance properties, target is the prototype; for static, it's the constructor.
 */
export function getPrototypeConstructor(target: object): (new (...args: unknown[]) => object) | undefined {
  const ctor = (target as { constructor?: new (...args: unknown[]) => object }).constructor;
  return typeof ctor === 'function' ? ctor : undefined;
}
