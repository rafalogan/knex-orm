import 'reflect-metadata';
import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from '@core/decorators';
import { SchemaBuilder } from '@adapters/migration/schema/schema-builder';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'string' })
  name!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreatedAt()
  createdAt!: Date;

  @UpdatedAt()
  updatedAt!: Date;

  @SoftDelete()
  deletedAt?: Date;
}

@Entity('posts')
class Post {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  title!: string;

  @Column({ type: 'integer' })
  userId!: number;
}

describe('SchemaBuilder', () => {
  let builder: SchemaBuilder;

  beforeEach(() => {
    builder = new SchemaBuilder();
  });

  describe('buildFromEntities', () => {
    it('should build schema from entity metadata', () => {
      const schema = builder.buildFromEntities([User, Post]);

      expect(schema.tables['users']).toBeDefined();
      expect(schema.tables['posts']).toBeDefined();
      expect(schema.version).toBe(1);
    });

    it('should include primary key in table schema', () => {
      const schema = builder.buildFromEntities([User]);

      expect(schema.tables['users'].primaryKey).toEqual({
        columnName: 'id',
        autoincrement: true,
      });
    });

    it('should include columns with correct types', () => {
      const schema = builder.buildFromEntities([User]);

      expect(schema.tables['users'].columns['id']).toMatchObject({
        columnName: 'id',
        type: 'integer',
      });
      expect(schema.tables['users'].columns['email']).toMatchObject({
        columnName: 'email',
        type: 'string',
        nullable: false,
        unique: true,
      });
      expect(schema.tables['users'].columns['name']).toMatchObject({
        columnName: 'name',
        type: 'string',
      });
      expect(schema.tables['users'].columns['deleted_at']).toMatchObject({
        columnName: 'deleted_at',
        type: 'timestamp',
        nullable: true,
      });
    });

    it('should map timestamp decorators to columns', () => {
      const schema = builder.buildFromEntities([User]);

      expect(schema.tables['users'].columns['created_at']).toBeDefined();
      expect(schema.tables['users'].columns['updated_at']).toBeDefined();
    });
  });
});
