import { MigrationGenerator } from '@adapters/migration/migration-generator';
import type { MigrationOp } from '@adapters/migration/schema/schema-diff';
import type { ColumnSchema } from '@adapters/migration/schema/schema-types';

describe('MigrationGenerator', () => {
  let generator: MigrationGenerator;

  beforeEach(() => {
    generator = new MigrationGenerator();
  });

  it('should generate createTable migration', () => {
    const ops: MigrationOp[] = [
      {
        type: 'createTable',
        table: 'users',
        schema: {
          tableName: 'users',
          columns: {
            id: { columnName: 'id', type: 'integer', nullable: false },
            email: { columnName: 'email', type: 'string', nullable: false, unique: true },
            name: { columnName: 'name', type: 'string' },
          },
          primaryKey: { columnName: 'id', autoincrement: true },
        },
      },
    ];

    const { content, up, down } = generator.generate(ops, 'create_users');

    expect(content).toContain("createTable('users'");
    expect(up).toContain('table.increments');
    expect(up).toContain("table.string('email'");
    expect(up).toContain('.notNullable()');
    expect(up).toContain('.unique()');
    expect(up).toContain("table.string('name'");
    expect(down).toContain("dropTableIfExists('users')");
  });

  it('should generate dropTable migration', () => {
    const ops: MigrationOp[] = [{ type: 'dropTable', table: 'posts' }];
    const { up, down } = generator.generate(ops, 'drop_posts');

    expect(up).toContain("dropTableIfExists('posts')");
    expect(down).toContain('posts');
  });

  it('should generate addColumn migration', () => {
    const ops: MigrationOp[] = [
      {
        type: 'addColumn',
        table: 'users',
        column: {
          columnName: 'bio',
          type: 'text',
          nullable: true,
        } as ColumnSchema,
      },
    ];
    const { up, down } = generator.generate(ops, 'add_bio_to_users');

    expect(up).toContain("alterTable('users'");
    expect(up).toContain("table.text('bio')");
    expect(down).toContain("dropColumn('bio')");
  });

  it('should generate dropColumn migration', () => {
    const ops: MigrationOp[] = [{ type: 'dropColumn', table: 'users', column: 'nickname' }];
    const { up, down } = generator.generate(ops, 'drop_nickname_from_users');

    expect(up).toContain("dropColumn('nickname')");
    expect(down).toContain('nickname');
  });

  it('should generate valid migration file with imports', () => {
    const ops: MigrationOp[] = [{ type: 'createTable', table: 'test', schema: { tableName: 'test', columns: {} } }];
    const { content } = generator.generate(ops, 'test');

    expect(content).toContain("import type { Knex } from 'knex'");
    expect(content).toContain('export async function up');
    expect(content).toContain('export async function down');
  });

  it('should generate addIndex migration', () => {
    const ops: MigrationOp[] = [{ type: 'addIndex', table: 'users', fields: ['email', 'tenant_id'] }];
    const { up, down } = generator.generate(ops, 'add_index');

    expect(up).toContain("alterTable('users'");
    expect(up).toContain("table.index(['email', 'tenant_id'])");
    expect(down).toContain("dropIndex(['email', 'tenant_id'])");
  });

  it('should generate dropIndex migration', () => {
    const ops: MigrationOp[] = [{ type: 'dropIndex', table: 'users', fields: ['email'] }];
    const { up, down } = generator.generate(ops, 'drop_index');

    expect(up).toContain("dropIndex(['email'])");
    expect(down).toContain("table.index(['email'])");
  });
});
