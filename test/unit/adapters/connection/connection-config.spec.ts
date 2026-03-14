import { join } from 'path';
import { ConnectionConfigLoader } from '@adapters/connection/connection-config';

const FIXTURES = join(__dirname, '../../../fixtures/connection');

describe('ConnectionConfigLoader', () => {
  it('should load config from module with default export', async () => {
    const loader = new ConnectionConfigLoader();
    const config = await loader.loadFromPath(join(FIXTURES, 'config-flat.js'));

    expect(config).toBeDefined();
    expect(config?.default).toBe('primary');
    expect(config?.connections).toBeDefined();
    expect(config?.connections?.primary).toBeDefined();
    expect(config?.connections?.primary?.client).toBe('sqlite3');
  });

  it('should resolve env when config has env keys', async () => {
    const loader = new ConnectionConfigLoader();
    const config = await loader.loadFromPath(join(FIXTURES, 'config-env.js'));

    const resolved = loader.resolveForEnv(config!, 'test');
    expect(resolved?.default).toBe('test_db');
    expect(resolved?.connections?.test_db?.client).toBe('sqlite3');
  });

  it('should return null when path does not exist', async () => {
    const loader = new ConnectionConfigLoader();
    const config = await loader.loadFromPath('/nonexistent/path.js');
    expect(config).toBeNull();
  });

  it('should return null when directory has no standard config files', () => {
    const loader = new ConnectionConfigLoader();
    const found = loader.findConfigPath(FIXTURES);
    expect(found).toBeNull();
  });

  it('should find config when orm.config.js exists in cwd', () => {
    const loader = new ConnectionConfigLoader();
    const found = loader.findConfigPath(process.cwd());
    expect(found).toBe(join(process.cwd(), 'orm.config.js'));
  });
});
