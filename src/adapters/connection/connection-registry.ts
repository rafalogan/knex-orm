import type { Knex } from 'knex';

/**
 * Registry of named Knex connections.
 */
export class ConnectionRegistry {
  private readonly connections = new Map<string, Knex>();

  register(name: string, knex: Knex): void {
    this.connections.set(name, knex);
  }

  get(name: string): Knex | undefined {
    return this.connections.get(name);
  }

  list(): string[] {
    return Array.from(this.connections.keys());
  }

  has(name: string): boolean {
    return this.connections.has(name);
  }

  clear(): void {
    this.connections.clear();
  }
}
