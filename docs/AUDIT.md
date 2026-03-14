# Auditoria: Documentação vs Implementação

**Data:** 2025-03-11  
**Objetivo:** Garantir que `docs/knex-orm-superset.md` reflete o comportamento real do sistema.

---

## 1. Resumo Executivo

| Área                           | Status              | Observações                                                      |
| ------------------------------ | ------------------- | ---------------------------------------------------------------- |
| CLI                            | ✅ Corrigido        | migrate:generate, migrate:run, migrate:rollback implementados    |
| Migrations                     | ✅ Corrigido        | addIndex/dropIndex implementados; alterColumn continua como TODO |
| Schema tracking                | ✅ OK               | .orm-schema.json implementado e funcional                        |
| Entity scan                    | ✅ OK               | EntityScanner + decorators + metadata funcionam                  |
| NestJS                         | ❌ Não implementado | Documentado como roadmap                                         |
| KnexORM (configure/initialize) | ❌ Não implementado | Documentado como roadmap                                         |

---

## 2. CLI

### 2.1 Comandos Documentados (Seção 5.2)

| Comando            | Doc | Implementado | Observação                       |
| ------------------ | --- | ------------ | -------------------------------- |
| migration:generate | ✅  | ✅           | Funciona com `--entities=<path>` |
| migration:run      | ✅  | ❌           | Não existe no CLI                |
| migration:rollback | ✅  | ❌           | Não existe no CLI                |

### 2.2 Nome do binário

- **Binários:** `kor` (atalho) e `knex-orm` (package.json bin)
- **Doc:** Usa `kor` como primário nos exemplos; `knex-orm` mantido para compatibilidade.

### 2.3 Sintaxe de migration:generate

- **Doc:** `knexorm migration:generate <NomeEntidade>`
- **Real:** `knex-orm migrate:generate --entities=./src/entities [--migrations-dir=migrations]`
- **Ação:** Doc deve refletir a API real (path ao módulo que exporta entidades).

### 2.4 Comandos do usuário (exemplos)

- `orm generate` — não documentado; pode ser alias de migrate:generate
- `orm schema:sync` — **não existe**; doc 10.3 lista como roadmap v2.0 ("Migrations automáticas")

---

## 3. Migrations

### 3.1 Operações de diff (Seção 5.3)

| Operação    | Doc | SchemaDiff | MigrationGenerator                          |
| ----------- | --- | ---------- | ------------------------------------------- |
| createTable | ✅  | ✅         | ✅                                          |
| addColumn   | ✅  | ✅         | ✅                                          |
| alterColumn | ✅  | ✅         | ⚠️ Gera TODO comentário (não altera coluna) |
| dropColumn  | ✅  | ✅         | ✅                                          |
| dropTable   | ✅  | ✅         | ✅                                          |
| addIndex    | ✅  | ❌         | ❌ (ignorado no switch)                     |
| dropIndex   | ✅  | ❌         | ❌ (ignorado no switch)                     |

### 3.2 Schema tracking

- **.orm-schema.json:** ✅ Implementado em `SchemaRegistry`
- Usado para diff entre entidades atuais e estado anterior
- Não lê schema do banco (doc 5.1 diz "Lê o schema atual do banco" — **não implementado**; diff é entidades vs .orm-schema.json anterior)

---

## 4. Entity Scan e Core

| Item                                | Status                                        |
| ----------------------------------- | --------------------------------------------- |
| EntityScanner                       | ✅ Implementado                               |
| @Entity                             | ✅                                            |
| @PrimaryKey                         | ✅                                            |
| @Column                             | ✅                                            |
| @CreatedAt, @UpdatedAt, @SoftDelete | ✅                                            |
| @Index                              | ✅ (metadata registrado; diff de índices não) |
| @Relation                           | ✅ (placeholder)                              |
| MetadataStorage                     | ✅                                            |
| getEntityMetadata                   | ✅                                            |

---

## 5. Não implementado (documentado como pronto)

### 5.1 NestJS (Seções 7, 10.1)

- `KnexOrmModule`, `forRoot()`, `forFeature()`
- `@InjectRepository(Entity)`, `@InjectConnection('name')`
- **Pasta:** `src/nestjs/` não existe
- **Export:** package.json tem `./nestjs` mas pasta não existe (build falharia)

### 5.2 KnexORM e Connection Registry (Seções 6, 8)

- `KnexORM.configure()`, `KnexORM.initialize()`
- `knex-orm.config.ts`
- `getConnection('secondary')`
- **Nenhuma** dessas APIs existe no código

### 5.3 Repository

- Doc usa `IRepository<T>` e `GenericRepository`
- Implementação usa `Repository` (nome diferente) e recebe `Knex` diretamente, não `IConnection`
- Interface `IRepository` não exportada

---

## 6. Ações Realizadas (2025-03-11)

### 6.1 Implementado

1. **CLI migration:run e migration:rollback** — carrega knexfile.js do projeto e executa `knex.migrate.latest()` / `knex.migrate.rollback()`
2. **addIndex/dropIndex** — SchemaDiff produz ops; MigrationGenerator gera código Knex; SchemaBuilder inclui índices de `@Column({ index: true })`

### 6.2 Documentação atualizada

1. **Seção 5.1:** Fluxo corrigido — diff é entidades vs .orm-schema.json
2. **Seção 5.2:** Comandos com `knex-orm`, sintaxe `--entities=`, exemplos
3. **Seção 5.4:** Nova subseção sobre Schema Tracking (`.orm-schema.json`)
4. **Seção 10.1:** Estado de implementação — separação entre implementado e roadmap

### 6.3 Pendente (roadmap)

- NestJS module completo
- KnexORM.initialize/configure e Connection Registry
- schema:sync (v2.0)
