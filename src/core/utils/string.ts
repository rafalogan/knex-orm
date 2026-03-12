/**
 * Converts PascalCase/camelCase to snake_case.
 * @example "User" -> "user", "createdAt" -> "created_at"
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (_, letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, "");
}
