import { isBun, isNode, getRuntime, getEnv } from '@core/runtime';

describe('runtime', () => {
  it('should return boolean from isBun', () => {
    expect(typeof isBun()).toBe('boolean');
  });

  it('should return boolean from isNode', () => {
    expect(typeof isNode()).toBe('boolean');
  });

  it('should return Runtime from getRuntime', () => {
    const r = getRuntime();
    expect(r === 'node' || r === 'bun').toBe(true);
  });

  it('should have isNode and isBun mutually exclusive when process exists', () => {
    if (typeof process !== 'undefined') {
      expect(isBun() !== isNode()).toBe(true);
    }
  });

  it('should return env value from getEnv when variable exists', () => {
    process.env['KNEX_ORM_TEST_VAR'] = 'test-value';
    expect(getEnv('KNEX_ORM_TEST_VAR')).toBe('test-value');
    delete process.env['KNEX_ORM_TEST_VAR'];
  });

  it('should return undefined from getEnv when variable does not exist', () => {
    expect(getEnv('NONEXISTENT_KNEX_ORM_VAR_12345')).toBeUndefined();
  });
});
