import 'reflect-metadata';
import { Entity, Column, PrimaryKey } from '@core/decorators';

describe('Entity invalid identifier (security)', () => {
  it('should throw when @Entity tableName contains invalid chars', () => {
    expect(() => {
      @Entity("users'; DROP TABLE users--")
      class BadEntity {
        @PrimaryKey()
        id!: number;
      }
    }).toThrow(TypeError);
  });

  it('should accept valid table names', () => {
    expect(() => {
      @Entity('valid_users')
      class GoodEntity {
        @PrimaryKey()
        id!: number;
      }
    }).not.toThrow();
  });
});
