import type { Knex } from 'knex';
import { ConnectionConfigLoader } from './connection-config';
import type { OrmConfig } from './connection-config';
import { ConnectionManager } from './connection-manager';
import { Repository } from '@adapters/repository';

/**
 * Main ORM facade for connection management.
 */
export class KnexORM {
  private static instance: KnexORM | null = null;
  private readonly manager = new ConnectionManager();

  /**
   * Configure and return config. Use with initialize().
   */
  static configure(config: OrmConfig): OrmConfig {
    return config;
  }

  /**
   * Initialize ORM from config. Returns the KnexORM instance.
   */
  static async initialize(config: OrmConfig): Promise<KnexORM> {
    const orm = new KnexORM();
    await orm.manager.initialize(config);
    KnexORM.instance = orm;
    return orm;
  }

  /**
   * Initialize ORM from config file path. Searches orm.config.js, knex-orm.config.js, knexfile.js.
   */
  static async initializeFromPath(configPath?: string): Promise<KnexORM> {
    const orm = new KnexORM();
    const loader = new ConnectionConfigLoader();
    const path = configPath ?? loader.findConfigPath();
    if (!path) {
      throw new Error('No config file found. Create orm.config.js or pass --config=path');
    }
    await orm.manager.initializeFromPath(path);
    KnexORM.instance = orm;
    return orm;
  }

  /**
   * Get connection by name. Uses default connection when name omitted.
   */
  getConnection(name?: string): Knex {
    return this.manager.getConnection(name);
  }

  /**
   * Get default connection.
   */
  getDefaultConnection(): Knex {
    return this.manager.getConnection();
  }

  /**
   * Get repository for entity. Uses default connection.
   */
  getRepository<T extends Record<string, unknown>>(entityClass: new () => T): Repository<T> {
    const knex = this.manager.getConnection();
    return new Repository(knex, entityClass);
  }

  /**
   * Close all connections.
   */
  async close(): Promise<void> {
    await this.manager.closeAll();
    if (KnexORM.instance === this) KnexORM.instance = null;
  }

  /**
   * Get global instance (if initialized via initialize/initializeFromPath).
   */
  static getInstance(): KnexORM | null {
    return KnexORM.instance;
  }

  /**
   * Get connection from global instance. Throws if not initialized.
   */
  static getConnection(name?: string): Knex {
    const orm = KnexORM.getInstance();
    if (!orm) {
      throw new Error('KnexORM not initialized. Call KnexORM.initialize() or KnexORM.initializeFromPath() first.');
    }
    return orm.getConnection(name);
  }
}
