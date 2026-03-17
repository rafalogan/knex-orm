import type { Knex } from 'knex';
import type { IConnection } from '@core/interfaces';

/**
 * Implementa IConnection encapsulando uma instância Knex.
 * Permite injeção e troca de conexão em testes ou NestJS.
 */
export class KnexAdapter implements IConnection {
  readonly knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }
}
