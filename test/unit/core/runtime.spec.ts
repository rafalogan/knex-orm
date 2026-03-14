import { isBun, isNode, getRuntime, type Runtime } from '@core/runtime';

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
});
