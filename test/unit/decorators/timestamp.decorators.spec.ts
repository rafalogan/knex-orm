import 'reflect-metadata';
import { Entity, getEntityMetadata } from '@core/decorators/entity.decorator';
import { CreatedAt, UpdatedAt, SoftDelete } from '@core/decorators/timestamp.decorators';

describe('@CreatedAt, @UpdatedAt, @SoftDelete decorators', () => {
  describe('compatibilidade de runtime', () => {
    it('deve ignorar CreatedAt quando target for undefined', () => {
      const decorator = CreatedAt();

      expect(() => decorator(undefined as unknown as object, 'createdAt')).not.toThrow();
    });

    it('deve ignorar UpdatedAt quando target for undefined', () => {
      const decorator = UpdatedAt();

      expect(() => decorator(undefined as unknown as object, 'updatedAt')).not.toThrow();
    });

    it('deve ignorar SoftDelete quando target for undefined', () => {
      const decorator = SoftDelete();

      expect(() => decorator(undefined as unknown as object, 'deletedAt')).not.toThrow();
    });
  });

  describe('@CreatedAt', () => {
    it('deve registrar coluna created_at com type timestamp e default CURRENT_TIMESTAMP', () => {
      @Entity('users')
      class User {
        @CreatedAt()
        createdAt!: Date;
      }

      const meta = getEntityMetadata(User);
      const col = meta?.columns?.createdAt;
      expect(col).toBeDefined();
      expect(col!.columnName).toBe('created_at');
      expect(col!.type).toBe('timestamp');
      expect(col!.default).toBe('CURRENT_TIMESTAMP');
    });
  });

  describe('@UpdatedAt', () => {
    it('deve registrar coluna updated_at com type timestamp e default CURRENT_TIMESTAMP', () => {
      @Entity('users')
      class User {
        @UpdatedAt()
        updatedAt!: Date;
      }

      const meta = getEntityMetadata(User);
      const col = meta?.columns?.updatedAt;
      expect(col).toBeDefined();
      expect(col!.columnName).toBe('updated_at');
      expect(col!.type).toBe('timestamp');
      expect(col!.default).toBe('CURRENT_TIMESTAMP');
    });
  });

  describe('@SoftDelete', () => {
    it('deve registrar coluna deleted_at com type timestamp e nullable', () => {
      @Entity('users')
      class User {
        @SoftDelete()
        deletedAt?: Date;
      }

      const meta = getEntityMetadata(User);
      const col = meta?.columns?.deletedAt;
      expect(col).toBeDefined();
      expect(col!.columnName).toBe('deleted_at');
      expect(col!.type).toBe('timestamp');
      expect(col!.nullable).toBe(true);
    });

    it('deve registrar softDelete no EntityMetadata para habilitar disable() no repositório', () => {
      @Entity('users')
      class User {
        @SoftDelete()
        deletedAt?: Date;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.softDelete).toBeDefined();
      expect(meta?.softDelete?.propertyName).toBe('deletedAt');
      expect(meta?.softDelete?.columnName).toBe('deleted_at');
    });
  });

  describe('integração combinada', () => {
    it('deve permitir CreatedAt, UpdatedAt e SoftDelete na mesma entidade', () => {
      @Entity('users')
      class User {
        @CreatedAt()
        createdAt!: Date;

        @UpdatedAt()
        updatedAt!: Date;

        @SoftDelete()
        deletedAt?: Date;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.columns?.createdAt?.columnName).toBe('created_at');
      expect(meta?.columns?.updatedAt?.columnName).toBe('updated_at');
      expect(meta?.columns?.deletedAt?.columnName).toBe('deleted_at');
      expect(meta?.softDelete?.columnName).toBe('deleted_at');
    });
  });
});
