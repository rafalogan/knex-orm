import 'reflect-metadata';
import { Entity, getEntityMetadata } from '@core/decorators/entity.decorator';

describe('@Entity decorator', () => {
  describe('without argument', () => {
    it('derives tableName from class name in snake_case', () => {
      @Entity()
      class User {}

      const meta = getEntityMetadata(User);
      expect(meta).toBeDefined();
      expect(meta?.tableName).toBe('user');
    });

    it('handles PascalCase with multiple words', () => {
      @Entity()
      class UserProfile {}

      const meta = getEntityMetadata(UserProfile);
      expect(meta?.tableName).toBe('user_profile');
    });
  });

  describe('with custom tableName', () => {
    it('uses provided tableName', () => {
      @Entity('users')
      class User {}

      const meta = getEntityMetadata(User);
      expect(meta?.tableName).toBe('users');
    });

    it('accepts any valid table name string', () => {
      @Entity('custom_table_name')
      class SomeEntity {}

      const meta = getEntityMetadata(SomeEntity);
      expect(meta?.tableName).toBe('custom_table_name');
    });
  });

  describe('metadata accessibility', () => {
    it('returns EntityMetadata via getEntityMetadata', () => {
      @Entity('products')
      class Product {}

      const meta = getEntityMetadata(Product);
      expect(meta).toEqual({ tableName: 'products' });
    });

    it('returns undefined for non-entity class', () => {
      class PlainClass {
        // Intentionally empty - not decorated with @Entity
      }

      const meta = getEntityMetadata(PlainClass);
      expect(meta).toBeUndefined();
    });
  });

  describe('subclass behavior', () => {
    it('subclass with own @Entity uses its tableName', () => {
      @Entity('base_table')
      class Base {}

      @Entity('child_table')
      class Child extends Base {}

      const childMeta = getEntityMetadata(Child);
      const baseMeta = getEntityMetadata(Base);

      expect(childMeta?.tableName).toBe('child_table');
      expect(baseMeta?.tableName).toBe('base_table');
    });

    it('subclass without @Entity derives tableName from subclass name', () => {
      @Entity('base_table')
      class Base {}

      @Entity()
      class Child extends Base {}

      const meta = getEntityMetadata(Child);
      expect(meta?.tableName).toBe('child');
    });
  });

  describe('invalid usage', () => {
    it('throws when applied to non-constructor', () => {
      const decorator = Entity();
      expect(() => decorator({} as never)).toThrow(TypeError);
    });

    it('throws when applied to non-function', () => {
      const decorator = Entity();
      expect(() => decorator('not a class' as never)).toThrow(TypeError);
    });
  });
});
