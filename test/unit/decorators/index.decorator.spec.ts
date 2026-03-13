import 'reflect-metadata';
import { Entity, getEntityMetadata } from '@core/decorators/entity.decorator';
import { Index } from '@core/decorators/index.decorator';

describe('@Index decorator', () => {
  describe('índice composto', () => {
    it('deve registrar índice com campos email e tenant_id', () => {
      @Entity('users')
      @Index(['email', 'tenant_id'])
      class User {
        email!: string;
        tenantId!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.indexes).toBeDefined();
      expect(meta?.indexes).toHaveLength(1);
      expect(meta?.indexes?.[0]?.fields).toEqual(['email', 'tenant_id']);
    });

    it('deve aceitar múltiplos @Index na mesma entidade', () => {
      @Entity('users')
      @Index(['email'])
      @Index(['tenant_id', 'status'])
      class User {
        email!: string;
        tenantId!: string;
        status!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.indexes).toHaveLength(2);
      // Ordem: decorators aplicados de baixo para cima; @Index(['tenant_id','status']) primeiro
      expect(meta?.indexes?.[0]?.fields).toEqual(['tenant_id', 'status']);
      expect(meta?.indexes?.[1]?.fields).toEqual(['email']);
    });

    it('deve incluir indexes no EntityMetadata retornado por getEntityMetadata', () => {
      @Entity('products')
      @Index(['sku', 'warehouse_id'])
      class Product {
        sku!: string;
        warehouseId!: string;
      }

      const meta = getEntityMetadata(Product);
      expect(meta?.tableName).toBe('products');
      expect(meta?.indexes).toEqual([{ fields: ['sku', 'warehouse_id'] }]);
    });
  });
});
