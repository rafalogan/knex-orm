import { join } from 'path';
import { ConnectionManager } from '@adapters/connection/connection-manager';

const FIXTURES = join(__dirname, '../../../fixtures/connection');

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  beforeEach(() => {
    manager = new ConnectionManager();
  });

  afterEach(async () => {
    await manager.closeAll();
  });

  it('should initialize from config path and create connections', async () => {
    await manager.initializeFromPath(join(FIXTURES, 'config-flat.js'));

    const knex = manager.getConnection('primary');
    expect(knex).toBeDefined();
  });

  it('should get default connection when name not specified', async () => {
    await manager.initializeFromPath(join(FIXTURES, 'config-flat.js'));

    const defaultConn = manager.getConnection();
    expect(defaultConn).toBeDefined();
  });

  it('should throw when not initialized', () => {
    const uninit = new ConnectionManager();
    expect(() => uninit.getConnection('primary')).toThrow(/not initialized/);
  });

  it('should resolve env when initializing', async () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
      await manager.initializeFromPath(join(FIXTURES, 'config-env.js'));
      const knex = manager.getConnection('test_db');
      expect(knex).toBeDefined();
    } finally {
      process.env.NODE_ENV = orig;
    }
  });
});
