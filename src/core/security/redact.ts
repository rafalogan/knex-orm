/**
 * Redacts sensitive data from connection config for safe logging.
 * Never log raw connection strings or credentials.
 */
export function redactConnectionConfig<T extends Record<string, unknown>>(config: T): Record<string, unknown> {
  if (!config || typeof config !== 'object') return config;
  const copy = { ...config } as Record<string, unknown>;
  if ('connection' in copy && copy.connection !== undefined) {
    copy.connection = '[REDACTED]';
  }
  return copy;
}
