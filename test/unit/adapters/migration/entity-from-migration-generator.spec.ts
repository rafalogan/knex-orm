import { EntityFromMigrationGenerator } from '@adapters/migration/entity-from-migration-generator';

describe('EntityFromMigrationGenerator', () => {
  it('should generate entity class from parsed table metadata', () => {
    const generator = new EntityFromMigrationGenerator();

    const code = generator.generate({
      tableName: 'users',
      columns: [
        { name: 'id', type: 'integer', primary: true, nullable: false },
        { name: 'email', type: 'string', nullable: false, unique: true },
        { name: 'name', type: 'string', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false },
        { name: 'updated_at', type: 'timestamp', nullable: false },
        { name: 'deleted_at', type: 'timestamp', nullable: true },
      ],
      foreignKeys: [],
      indexes: [],
    });

    expect(code).toContain("import { Entity, PrimaryKey, Column, CreatedAt, UpdatedAt, SoftDelete } from 'knx-orm';");
    expect(code).toContain("@Entity('users')");
    expect(code).toContain('export class User');
    expect(code).toContain('@PrimaryKey()');
    expect(code).toContain('id!: number;');
    expect(code).toContain("@Column({ type: 'string', unique: true })");
    expect(code).toContain('email!: string;');
    expect(code).toContain("@Column({ type: 'string', nullable: true })");
    expect(code).toContain('name?: string | null;');
    expect(code).toContain('@CreatedAt()');
    expect(code).toContain('createdAt!: Date;');
    expect(code).toContain('@UpdatedAt()');
    expect(code).toContain('updatedAt!: Date;');
    expect(code).toContain('@SoftDelete()');
    expect(code).toContain('deletedAt?: Date;');
  });
});
