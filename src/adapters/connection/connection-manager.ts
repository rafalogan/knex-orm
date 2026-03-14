import type { Knex } from 'knex';
import { ConnectionConfigLoader } from './connection-config';
import type { OrmConfig } from './connection-config';
import { ConnectionFactory } from './connection-factory';
import { ConnectionRegistry } from './connection-registry';

/**
 * Orchestrates config loading, connection creation, and registry.
 */
export class ConnectionManager {
  private readonly loader = new ConnectionConfigLoader();
  private readonly factory = new ConnectionFactory();
  private readonly registry = new ConnectionRegistry();
  private defaultConnectionName: string | null = null;
  private initialized = false;

  async initializeFromPath(configPath: string): Promise<void> {
    const raw = await this.loader.loadFromPath(configPath);
    if (!raw) {
      throw new Error(`Failed to load config from ${configPath}`);
    }

    const env = process.env.NODE_ENV ?? 'development';
    const config = this.loader.resolveForEnv(raw, env);
    if (!config) {
      throw new Error(`No config found for env ${env}`);
    }

    await this.initialize(config);
  }

  async initialize(config: OrmConfig): Promise<void> {
    this.defaultConnectionName = config.default;

    for (const [name, entry] of Object.entries(config.connections)) {
      const knex = this.factory.create(entry);
      this.registry.register(name, knex);
    }

    this.initialized = true;
  }

  getConnection(name?: string): Knex {
    if (!this.initialized) {
      throw new Error('ConnectionManager not initialized. Call initialize() or initializeFromPath() first.');
    }

    const key = name ?? this.defaultConnectionName;
    if (!key) {
      throw new Error('No default connection configured');
    }

    const knex = this.registry.get(key);
    if (!knex) {
      throw new Error(`Connection '${key}' not found`);
    }

    return knex;
  }

  getRegistry(): ConnectionRegistry {
    return this.registry;
  }

  async closeAll(): Promise<void> {
    for (const name of this.registry.list()) {
      const knex = this.registry.get(name);
      if (knex) await knex.destroy();
    }
    this.registry.clear();
    this.initialized = false;
    this.defaultConnectionName = null;
  }
}
