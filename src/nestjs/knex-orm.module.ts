import { type DynamicModule, type OnModuleDestroy, type Type, Module } from '@nestjs/common';
import { ConnectionManager } from '@adapters/connection/connection-manager';
import type { OrmConfig } from '@adapters/connection/connection-config';
import { Repository } from '@adapters/repository';
import { KNEX_ORM_CONNECTION_MANAGER, getConnectionToken, getRepositoryToken } from './constants';

/**
 * Closes all connections when the NestJS application shuts down.
 */
class ConnectionManagerOnDestroy implements OnModuleDestroy {
  constructor(private readonly manager: ConnectionManager) {}
  async onModuleDestroy(): Promise<void> {
    await this.manager.closeAll();
  }
}

/**
 * NestJS module for KnexORM integration.
 */
@Module({})
export class KnexOrmModule {
  /**
   * Registers connections globally. Call once in AppModule.
   */
  static forRoot(options: OrmConfig): DynamicModule {
    const manager = new ConnectionManager();
    const connectionNames = Object.keys(options.connections);

    return {
      module: KnexOrmModule,
      global: true,
      providers: [
        {
          provide: KNEX_ORM_CONNECTION_MANAGER,
          useFactory: async () => {
            await manager.initialize(options);
            return manager;
          },
        },
        {
          provide: ConnectionManagerOnDestroy,
          useFactory: (mgr: ConnectionManager) => new ConnectionManagerOnDestroy(mgr),
          inject: [KNEX_ORM_CONNECTION_MANAGER],
        },
        {
          provide: getConnectionToken(),
          useFactory: (mgr: ConnectionManager) => mgr.getConnection(),
          inject: [KNEX_ORM_CONNECTION_MANAGER],
        },
        ...connectionNames.map((name) => ({
          provide: getConnectionToken(name),
          useFactory: (mgr: ConnectionManager) => mgr.getConnection(name),
          inject: [KNEX_ORM_CONNECTION_MANAGER],
        })),
      ],
      exports: [
        KNEX_ORM_CONNECTION_MANAGER,
        getConnectionToken(),
        ...connectionNames.map((n) => getConnectionToken(n)),
      ],
    };
  }

  /**
   * Registers repositories for entities. Call in feature modules.
   */
  static forFeature(entities: Type<object>[], connectionName?: string): DynamicModule {
    const token = connectionName ? getConnectionToken(connectionName) : getConnectionToken();

    const repoProviders = entities.map((entity) => ({
      provide: getRepositoryToken(entity as new () => object),
      useFactory: (knex: import('knex').Knex) => new Repository(knex, entity as new () => Record<string, unknown>),
      inject: [token],
    }));

    return {
      module: KnexOrmModule,
      providers: repoProviders,
      exports: repoProviders.map((p) => p.provide),
    };
  }
}
