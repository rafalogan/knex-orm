/**
 * Validates SQL identifiers (table/column names) to prevent injection.
 * Allows alphanumeric and underscore only.
 */
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Returns true if the string is a safe SQL identifier (table/column name).
 */
export function isValidSqlIdentifier(str: string): boolean {
  return typeof str === 'string' && str.length > 0 && SAFE_IDENTIFIER.test(str);
}

/**
 * Throws TypeError if the string is not a safe SQL identifier.
 */
export function assertValidSqlIdentifier(str: string, context?: string): void {
  if (!isValidSqlIdentifier(str)) {
    throw new TypeError(
      context
        ? `Invalid SQL identifier "${str}" in ${context}: use alphanumeric and underscore only`
        : `Invalid SQL identifier "${str}": use alphanumeric and underscore only`,
    );
  }
}
