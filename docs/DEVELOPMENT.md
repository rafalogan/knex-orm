# Guia de Desenvolvimento — knex-orm

> Orientações para contribuir no projeto, seguindo TDD e boas práticas definidas em `.rules`.

---

## Índice

1. [Regras do Projeto](#1-regras-do-projeto)
2. [Fluxo TDD](#2-fluxo-tdd)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Convenções de Código](#4-convenções-de-código)
5. [Testes](#5-testes)
6. [Lint e Formatação](#6-lint-e-formatação)
7. [Commits](#7-commits)

---

## 1. Regras do Projeto

O arquivo **`.rules`** na raiz do projeto define as regras de desenvolvimento. Resumo:

- **TDD obrigatório em todo código** — teste primeiro, implementação depois, refactor por último. Sem exceção.
- **TypeScript strict** — proibido `any`
- **Testes isolados** — sem estado compartilhado entre casos
- **Consultar docs** — antes de assumir comportamentos não documentados
- **Dúvidas** — perguntar ANTES de gerar código para aumentar contexto
- **Melhorias** — listar e perguntar se deve implementar ANTES de codar
- **Nunca assumir** — em caso de incerteza, perguntar

Consulte `.rules` para regras completas (estilo, arquitetura, antipadrões).

---

## 2. Fluxo TDD

### Etapa 0 — Leitura e Análise

- Leia `./docs` (especialmente `knex-orm-superset.md`)
- Leia testes existentes em `./test/unit` e `./test/integration`
- Pesquise documentação oficial e boas práticas
- Em caso de ambiguidade → **PARE e pergunte**

### Etapa 1 — RED

- Escreva o teste **antes** da implementação
- Unitários: `./test/unit/<módulo>/<arquivo>.spec.ts`
- Integração: `./test/integration/<módulo>/<arquivo>.spec.ts`
- Cubra: sucesso, erro, edge cases, dados inválidos
- Execute os testes → devem **FALHAR**

### Etapa 2 — GREEN

- Implemente apenas o necessário para os testes passarem
- Execute os testes → devem **PASSAR**

### Etapa 3 — REFACTOR

- Aplique SOLID, tipagem estrita, clean code
- Atualize barrels (`index.ts`) se necessário
- Execute os testes → devem continuar **PASSANDO**

---

## 3. Estrutura de Pastas

```
knex-orm/
├── src/
│   ├── core/           # Decorators, metadata, types (sem deps externas)
│   │   ├── decorators/
│   │   ├── metadata/
│   │   ├── types/
│   │   └── utils/
│   ├── adapters/       # Knex, migration, repository
│   ├── nestjs/         # Integração NestJS
│   ├── cli/            # kor / knex-orm
│   └── index.ts
├── test/
│   ├── unit/
│   └── integration/
├── docs/
├── .rules              # Regras de desenvolvimento
└── package.json
```

---

## 4. Convenções de Código

### Nomenclatura

- **camelCase** para propriedades e variáveis
- **snake_case** para nomes de colunas e tabelas
- **PascalCase** para decorators e classes

### Decorators

- Apenas registram metadata; sem lógica de negócio
- Validar inputs (ex.: `typeof target !== "function"` em `@Entity`)
- Usar `TypeError` para uso inválido

### Tipagem

- Sem `any`; usar tipos explícitos ou `unknown` com type guards
- JSDoc mínimo em exports públicos

---

## 5. Testes

Estratégia conforme Módulo 9 (`docs/knex-orm-superset.md`):

| Comando | Descrição |
|---------|-----------|
| `npm test` | Jest — suite completa |
| `npm run test:coverage` | Jest com relatório de cobertura |
| `bun test` | Bun test (requer Bun instalado) |

Estrutura: `test/unit/` (mocks) e `test/integration/` (SQLite in-memory).

```bash
npm test              # Jest (Node)
npm run test:coverage # Jest com cobertura
npm run test:bun      # Bun test (requer Bun)
```

- Cada teste 100% independente
- `beforeEach` para reset de estado/mocks
- Nomes: `"deve [resultado] quando [condição]"` ou `"should [result] when [condition]"`

---

## 6. Lint e Formatação

```bash
npm run lint        # ESLint
npm run lint:fix    # ESLint com correção automática
npm run format      # Prettier (formata arquivos)
npm run format:check # Prettier (apenas verifica, útil em CI)
```

Execute antes de commitar. O pre-commit (se configurado) pode rodar automaticamente.

---

## 7. Commits

O projeto usa **Conventional Commits**. Consulte [COMMITS_RULES.md](./COMMITS_RULES.md).

- Formato: `type(scope): subject`
- Mensagens em **inglês**
- Uma intenção lógica por commit

---

## Referências

- [knex-orm-superset.md](./knex-orm-superset.md) — Arquitetura completa
- [COMMITS_RULES.md](./COMMITS_RULES.md) — Regras de commits
- [.rules](../.rules) — Regras de desenvolvimento (na raiz do projeto)
