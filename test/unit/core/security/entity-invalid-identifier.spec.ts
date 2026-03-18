import 'reflect-metadata';
import { Entity, PrimaryKey } from '@core/decorators';

describe('Entity invalid identifier (security)', () => {
  it('should throw when @Entity tableName contains invalid chars', () => {
    expect(() => {
      @Entity("users'; DROP TABLE users--")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class BadEntity {
        @PrimaryKey()
        id!: number;
      }
    }).toThrow(TypeError);
  });

  it('should accept valid table names', () => {
    expect(() => {
      @Entity('valid_users')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class GoodEntity {
        @PrimaryKey()
        id!: number;
      }
    }).not.toThrow();
  });
});
