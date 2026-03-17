import { redactConnectionConfig } from '@core/security/redact';

describe('redactConnectionConfig', () => {
  it('should redact connection field', () => {
    const config = {
      client: 'pg',
      connection: { host: 'localhost', password: 'secret' },
    };
    const redacted = redactConnectionConfig(config);
    expect(redacted.connection).toBe('[REDACTED]');
    expect(redacted.client).toBe('pg');
  });

  it('should handle config without connection', () => {
    const config = { client: 'sqlite3' };
    const redacted = redactConnectionConfig(config);
    expect(redacted).toEqual({ client: 'sqlite3' });
  });
});
