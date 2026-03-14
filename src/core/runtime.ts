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
