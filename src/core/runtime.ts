/**
 * Runtime detection for Node.js vs Bun.
 * Used for dual-runtime compatibility and future plugin/extension points.
 */

export type Runtime = 'node' | 'bun';

/**
 * Detects if the code is running in Bun.
 * Works without @types/bun.
 */
export function isBun(): boolean {
  return typeof process !== 'undefined' && !!process.versions?.bun;
}

/**
 * Detects if the code is running in Node.js.
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && !process.versions?.bun;
}

/**
 * Returns the current runtime.
 */
export function getRuntime(): Runtime {
  return isBun() ? 'bun' : 'node';
}

/**
 * Unified env access for Node and Bun.
 * Bun loads .env automatically; in Node use dotenv or equivalent.
 * @param key - Environment variable name
 * @returns Value or undefined
 */
export function getEnv(key: string): string | undefined {
  const g = globalThis as { Bun?: { env?: Record<string, string> } };
  const bunEnv = g.Bun?.env;
  if (bunEnv) {
    return bunEnv[key];
  }
  return process.env[key];
}
