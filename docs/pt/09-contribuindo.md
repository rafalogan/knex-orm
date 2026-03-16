## Visão geral

Este documento descreve como contribuir com o knex-orm seguindo as regras definidas em:

- `.rules`
- `docs/DEVELOPMENT.md`
- `docs/COMMITS_RULES.md`

O objetivo é manter a qualidade do código, a consistência da arquitetura e uma experiência previsível para quem usa a biblioteca.

---

## Setup do ambiente

1. **Fork** o repositório no GitHub.
2. **Clone** o fork:

   ```bash
   git clone https://github.com/<seu-usuario>/knex-orm.git
   cd knex-orm
   ```

3. **Instale dependências**:

   ```bash
   npm install
   ```

4. **Verifique o ambiente**:

   ```bash
   npm test
   npm run build
   ```

Garanta que os testes passem e o build seja bem-sucedido antes de começar a alterar código.

---

## Fluxo de contribuição

1. Crie uma branch para sua mudança:

   ```bash
   git checkout -b feat/minha-feature
   ```

2. Faça alterações pequenas e coesas.
3. Escreva testes antes (TDD) e valide com `npm test`.
4. Garanta que o lint e o formatador estejam em dia:

   ```bash
   npm run lint
   npm run format:check
   ```

5. Use **Conventional Commits** (veja seção seguinte).
6. Faça push da branch para o seu fork:

   ```bash
   git push origin feat/minha-feature
   ```

7. Abra um **Pull Request** no repositório principal, descrevendo:
   - O problema que está sendo resolvido
   - O que foi alterado
   - Como testar

---

## Commits

As regras completas estão em `docs/COMMITS_RULES.md`.  
Resumo:

- Mensagens de commit **em inglês**.
- Formato:

  ```text
  <type>(<scope>): <subject>
  ```

- Tipos comuns:
  - `feat` — nova funcionalidade
  - `fix` — correção de bug
  - `docs` — documentação
  - `refactor` — refatoração sem mudar comportamento
  - `perf` — otimização de performance
  - `test` — alterações em testes
  - `build`, `ci`, `chore`, `security`, `revert`
- Exemplos:

  ```text
  feat(repository): add soft delete support
  fix(migration): handle addIndex operation
  docs: add pt/en usage guide
  test(connection): cover initializeFromPath error cases
  ```

Use `BREAKING CHANGE:` no rodapé quando houver alterações incompatíveis.

---

## Estilo de código

As regras de estilo são centralizadas em `.rules` e detalhadas em `docs/DEVELOPMENT.md`:

- TypeScript **strict** — sem `any` (explícito ou implícito).
- Nomes em inglês para código (classes, funções, variáveis); comentários em português quando necessário.
- `camelCase` para variáveis/propriedades; `snake_case` para nomes de tabelas/colunas.
- Decorators:
  - Não contêm lógica de negócio — apenas registram metadata.
  - Validam entradas (por exemplo, `@Entity` deve ser usado em construtores).
  - Lançam `TypeError` em usos inválidos.
- Comentários apenas quando o **porquê** não estiver óbvio pelo código.

Execute sempre:

```bash
npm run lint
npm run format
```

antes de abrir o PR (ou configure o editor para formatar e rodar ESLint automaticamente).

---

## Testes e qualidade

Antes de enviar um PR:

1. Rode a suite de testes:

   ```bash
   npm test
   npm run test:bun
   ```

2. Se a mudança for grande, verifique cobertura:

   ```bash
   npm run test:coverage
   ```

3. Garanta que os limiares globais definidos em `jest.config.js` continuam sendo atendidos.
4. Adicione testes para:
   - Novas funcionalidades (unitários e/ou integração).
   - Correções de bug (regressão).

Os exemplos existentes em `test/unit/**` e `test/integration/**` servem como referência de padrão de escrita.

---

## Processo de review

Ao abrir um PR:

- Descreva claramente:
  - O problema/feature
  - O comportamento atual vs esperado
  - Como testar (comandos, cenários)
- Mantenha o PR **focado**:
  - Evite misturar refactors grandes com novas features.
  - Evite mudanças puramente de formatação em conjunto com alterações funcionais.
- Responda feedbacks de review com commits adicionais claros (mantendo o histórico limpo).

Revisores vão olhar, em geral:

- Cobertura de testes
- Clareza das mudanças
- Aderência à arquitetura (Core vs Adapters vs NestJS vs CLI)
- Impacto em performance e segurança

---

## Como reportar bugs e pedir features

Use a página de issues do repositório (definida em `package.json`):

- URL de bugs/issues: `https://github.com/knex-orm/knex-orm/issues`

Ao abrir uma issue:

- Inclua:
  - Versão do `knex-orm`
  - Ambiente (Node/Bun, banco, SO)
  - Passos para reproduzir
  - Resultado esperado vs obtido
  - Log relevante (sem segredos)

Para pedidos de feature:

- Explique o caso de uso
- Compare com o que já existe (por exemplo, TypeORM/Prisma/MikroORM)
- Indique se estaria disposto a ajudar na implementação

---

## Código de conduta (resumo)

Ainda que não haja um arquivo específico de Code of Conduct neste repositório, adote as seguintes diretrizes:

- Respeito absoluto entre participantes (sem ataques pessoais, assédio ou linguagem tóxica).
- Foco em soluções técnicas e comportamentos observáveis.
- Abertura a feedbacks e a críticas construtivas.
- Zero tolerância a discriminação de qualquer tipo.

Qualquer comportamento que viole esses princípios pode resultar em bloqueio de contribuições e/ou reporte à plataforma.

