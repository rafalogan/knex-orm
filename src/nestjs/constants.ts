/**
 * Injection tokens for KnexORM NestJS integration.
 */

export const KNEX_ORM_CONNECTION_MANAGER = 'KNEX_ORM_CONNECTION_MANAGER';

export function getConnectionToken(name?: string): string {
  return name ? `KNEX_ORM_CONNECTION_${name}` : 'KNEX_ORM_CONNECTION_DEFAULT';
}

export function getRepositoryToken(entity: new (...args: unknown[]) => unknown): string {
  return `KNEX_ORM_REPOSITORY_${entity.name}`;
}
