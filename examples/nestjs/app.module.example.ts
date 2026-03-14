/**
 * Exemplo mínimo de uso do KnexOrmModule no NestJS.
 *
 * Uso: importe no AppModule do seu projeto NestJS.
 *
 * Instale: npm i knex-orm @nestjs/core @nestjs/common knex reflect-metadata
 */
import { Module, Injectable } from '@nestjs/common';
import {
  KnexOrmModule,
  InjectRepository,
  InjectConnection,
} from 'knex-orm/nestjs';
import {
  Entity,
  PrimaryKey,
  Column,
  type IRepository,
} from 'knex-orm';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  name!: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: IRepository<User>,
  ) {}

  async findActive() {
    return this.userRepo.find({ where: { name: 'test' } });
  }
}

@Injectable()
export class DbService {
  constructor(@InjectConnection() private readonly knex: import('knex').Knex) {}

  getKnex() {
    return this.knex;
  }
}

@Module({
  imports: [
    KnexOrmModule.forRoot({
      default: 'primary',
      connections: {
        primary: {
          client: 'sqlite3',
          connection: { filename: ':memory:' },
        },
      },
    }),
    KnexOrmModule.forFeature([User]),
  ],
  providers: [UserService, DbService],
  exports: [UserService],
})
export class AppModule {}
