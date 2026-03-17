import 'reflect-metadata';
import { Entity, getEntityMetadata } from '@core/decorators/entity.decorator';
import { PrimaryKey } from '@core/decorators/primary-key.decorator';

describe('@PrimaryKey decorator', () => {
  beforeEach(() => {
    // Reset metadata between tests - MetadataStorage is module-level
    // Each test uses a fresh class to avoid pollution
  });

  describe('compatibilidade de runtime', () => {
    it('deve ignorar aplicação quando target for undefined', () => {
      const decorator = PrimaryKey();

      expect(() => decorator(undefined as unknown as object, 'id')).not.toThrow();
    });
  });

  describe('sem opções', () => {
    it('deve registrar primaryKey com propertyName e columnName em snake_case quando aplicado em propriedade', () => {
      @Entity('users')
      class User {
        @PrimaryKey()
        id!: number;
      }

      const meta = getEntityMetadata(User);
      expect(meta).toBeDefined();
      expect(meta?.primaryKey).toBeDefined();
      expect(meta?.primaryKey?.propertyName).toBe('id');
      expect(meta?.primaryKey?.columnName).toBe('id');
    });

    it('deve converter propertyName para snake_case quando camelCase', () => {
      @Entity('items')
      class Item {
        @PrimaryKey()
        itemId!: number;
      }

      const meta = getEntityMetadata(Item);
      expect(meta?.primaryKey?.propertyName).toBe('itemId');
      expect(meta?.primaryKey?.columnName).toBe('item_id');
    });
  });

  describe('com opções', () => {
    it('deve registrar uuid: true quando @PrimaryKey({ uuid: true })', () => {
      @Entity('users')
      class User {
        @PrimaryKey({ uuid: true })
        id!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.primaryKey?.options?.uuid).toBe(true);
    });

    it('deve registrar autoincrement: true quando @PrimaryKey({ autoincrement: true })', () => {
      @Entity('users')
      class User {
        @PrimaryKey({ autoincrement: true })
        id!: number;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.primaryKey?.options?.autoincrement).toBe(true);
    });

    it('deve aceitar ambas opções simultaneamente', () => {
      @Entity('users')
      class User {
        @PrimaryKey({ autoincrement: false, uuid: true })
        id!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.primaryKey?.options?.autoincrement).toBe(false);
      expect(meta?.primaryKey?.options?.uuid).toBe(true);
    });
  });

  describe('integração com @Entity', () => {
    it('deve incluir primaryKey no EntityMetadata retornado por getEntityMetadata', () => {
      @Entity('products')
      class Product {
        @PrimaryKey()
        id!: number;
      }

      const meta = getEntityMetadata(Product);
      expect(meta?.tableName).toBe('products');
      expect(meta?.primaryKey).toEqual({
        propertyName: 'id',
        columnName: 'id',
        options: undefined,
      });
    });
  });
});
