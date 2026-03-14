import 'reflect-metadata';
import { Entity, PrimaryKey, Column } from '@core/decorators';
import { EntityScanner } from '@core/metadata/entity-scanner';

@Entity('users')
class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  email!: string;
}

class PlainClass {
  name = 'test';
}

describe('EntityScanner', () => {
  let scanner: EntityScanner;

  beforeEach(() => {
    scanner = new EntityScanner();
  });

  it('should return only classes with @Entity', () => {
    const result = scanner.scan([User, PlainClass]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(User);
  });

  it('should return metadata for scanned entities', () => {
    const result = scanner.getMetadata([User, PlainClass]);
    expect(result).toHaveLength(1);
    expect(result[0].metadata?.tableName).toBe('users');
    expect(result[0].constructor).toBe(User);
  });
});
