import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { KnexOrmModule, InjectRepository, InjectConnection } from 'knex-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import type { Repository } from '@adapters/repository';
import type { Knex } from 'knex';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  name!: string;
}

@Injectable()
class UserService {
  constructor(@InjectRepository(User) public readonly userRepo: Repository<User>) {}
}

@Injectable()
class ConnectionService {
  constructor(@InjectConnection() public readonly knex: Knex) {}
}

describe('KnexOrmModule', () => {
  it('should provide Repository when forRoot and forFeature are used', async () => {
    const module = await Test.createTestingModule({
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
      providers: [UserService],
    }).compile();

    const service = module.get(UserService);
    expect(service.userRepo).toBeDefined();
    expect(service.userRepo.tableName).toBe('users');
  });

  it('should provide Knex connection when InjectConnection is used', async () => {
    const module = await Test.createTestingModule({
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
      ],
      providers: [ConnectionService],
    }).compile();

    const service = module.get(ConnectionService);
    expect(service.knex).toBeDefined();
    expect(typeof service.knex).toBe('function');
  });

  it('should provide named connection when InjectConnection(name) is used', async () => {
    @Injectable()
    class SecondaryConnectionService {
      constructor(@InjectConnection('secondary') public readonly knex: Knex) {}
    }

    const module = await Test.createTestingModule({
      imports: [
        KnexOrmModule.forRoot({
          default: 'primary',
          connections: {
            primary: {
              client: 'sqlite3',
              connection: { filename: ':memory:' },
            },
            secondary: {
              client: 'sqlite3',
              connection: { filename: ':memory:' },
            },
          },
        }),
      ],
      providers: [SecondaryConnectionService],
    }).compile();

    const service = module.get(SecondaryConnectionService);
    expect(service.knex).toBeDefined();
  });
});
