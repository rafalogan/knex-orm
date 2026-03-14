/**
 * Integration test: NestJS full CRUD flow.
 * KnexOrmModule with forRoot/forFeature, @InjectRepository, real SQLite.
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { KnexOrmModule, InjectRepository, InjectConnection, KNEX_ORM_CONNECTION_MANAGER } from 'knex-orm/nestjs';
import type { ConnectionManager } from '@adapters/connection/connection-manager';
import { Injectable } from '@nestjs/common';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import type { IRepository } from 'knex-orm';
import type { Knex } from 'knex';

@Entity('posts')
class Post {
  @PrimaryKey()
  id!: number;
  @Column({ type: 'string' })
  title!: string;
  @Column({ type: 'boolean' })
  published!: boolean;
}

@Injectable()
class PostService {
  constructor(@InjectRepository(Post) private readonly postRepo: IRepository<Post>) {}

  async createPost(title: string, published: boolean): Promise<Post> {
    return this.postRepo.create({ title, published });
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepo.find({ where: { published: true } });
  }

  async findAll(): Promise<Post[]> {
    return this.postRepo.find({});
  }
}

@Injectable()
class SchemaSetup {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async createPostsTable(): Promise<void> {
    await this.knex.schema.createTable('posts', (t) => {
      t.increments('id').primary();
      t.string('title');
      t.boolean('published');
    });
  }
}

describe('NestJS CRUD integration', () => {
  it('should perform full CRUD via injected repository', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        KnexOrmModule.forRoot({
          default: 'primary',
          connections: {
            primary: {
              client: 'sqlite3',
              connection: { filename: ':memory:' },
              useNullAsDefault: true,
            },
          },
        }),
        KnexOrmModule.forFeature([Post]),
      ],
      providers: [PostService, SchemaSetup],
    }).compile();

    const schemaSetup = moduleRef.get(SchemaSetup);
    await schemaSetup.createPostsTable();

    const postService = moduleRef.get(PostService);

    const created = await postService.createPost('First Post', true);
    expect(created.id).toBeDefined();
    expect(created.title).toBe('First Post');
    expect(created.published).toBeTruthy();

    await postService.createPost('Draft', false);

    const published = await postService.findPublished();
    expect(published).toHaveLength(1);
    expect(published[0].title).toBe('First Post');

    const all = await postService.findAll();
    expect(all).toHaveLength(2);

    const manager = moduleRef.get<ConnectionManager>(KNEX_ORM_CONNECTION_MANAGER);
    await manager.closeAll();
  });
});
