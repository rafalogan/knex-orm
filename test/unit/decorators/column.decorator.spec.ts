import 'reflect-metadata';
import { Entity, getEntityMetadata } from '@core/decorators/entity.decorator';
import { Column } from '@core/decorators/column.decorator';

describe('@Column decorator', () => {
  describe('opções básicas', () => {
    it('deve registrar coluna com type e columnName em snake_case', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string' })
        email!: string;
      }

      const meta = getEntityMetadata(User);
      const col = meta?.columns?.email;
      expect(col).toBeDefined();
      expect(col!.columnName).toBe('email');
      expect(col!.type).toBe('string');
    });

    it('deve converter propertyName para snake_case quando camelCase', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string' })
        fullName!: string;
      }

      const meta = getEntityMetadata(User);
      const col = meta?.columns?.fullName;
      expect(col).toBeDefined();
      expect(col!.columnName).toBe('full_name');
    });

    it('deve aceitar tipos integer, uuid e json da seção 3.2', () => {
      @Entity('test')
      class TestEntity {
        @Column({ type: 'integer' })
        count!: number;

        @Column({ type: 'uuid' })
        refId!: string;

        @Column({ type: 'json' })
        metadata!: Record<string, unknown>;
      }

      const meta = getEntityMetadata(TestEntity);
      expect(meta?.columns?.count?.type).toBe('integer');
      expect(meta?.columns?.refId?.type).toBe('uuid');
      expect(meta?.columns?.metadata?.type).toBe('json');
    });
  });

  describe('opções nullable, default, unique, index', () => {
    it('deve registrar nullable: false quando especificado', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string', nullable: false })
        email!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.columns?.email?.nullable).toBe(false);
    });

    it('deve registrar nullable: true quando especificado', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string', nullable: true })
        middleName!: string | null;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.columns?.middleName?.nullable).toBe(true);
    });

    it('deve registrar default quando especificado', () => {
      @Entity('users')
      class User {
        @Column({ type: 'boolean', default: true })
        active!: boolean;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.columns?.active?.default).toBe(true);
    });

    it('deve registrar unique: true quando especificado', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string', unique: true })
        email!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.columns?.email?.unique).toBe(true);
    });

    it('deve registrar index: true quando especificado', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string', index: true })
        username!: string;
      }

      const meta = getEntityMetadata(User);
      expect(meta?.columns?.username?.index).toBe(true);
    });

    it('deve aceitar default como string (ex: CURRENT_TIMESTAMP)', () => {
      @Entity('logs')
      class Log {
        @Column({ type: 'timestamp', default: 'CURRENT_TIMESTAMP' })
        createdAt!: Date;
      }

      const meta = getEntityMetadata(Log);
      expect(meta?.columns?.createdAt?.default).toBe('CURRENT_TIMESTAMP');
    });
  });

  describe('múltiplas colunas', () => {
    it('deve registrar múltiplas colunas na mesma entidade', () => {
      @Entity('users')
      class User {
        @Column({ type: 'string' })
        email!: string;

        @Column({ type: 'string' })
        name!: string;

        @Column({ type: 'boolean', default: true })
        active!: boolean;
      }

      const meta = getEntityMetadata(User);
      expect(Object.keys(meta?.columns ?? {})).toHaveLength(3);
      expect(meta?.columns?.email?.type).toBe('string');
      expect(meta?.columns?.name?.type).toBe('string');
      expect(meta?.columns?.active?.type).toBe('boolean');
      expect(meta?.columns?.active?.default).toBe(true);
    });
  });
});
