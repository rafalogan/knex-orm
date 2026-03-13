# CLAUDE.md — Regras de Desenvolvimento

## PRINCÍPIO FUNDAMENTAL

Toda tarefa de desenvolvimento segue **TDD obrigatório**: teste primeiro, implementação depois.

---

## FLUXO DE EXECUÇÃO

### 0. ANTES DE CODAR — Leitura e Pesquisa

- Leia `./docs` para contexto do projeto
- Leia `./test/unit` e `./test/integration` para entender padrões existentes
- Pesquise na web: documentação oficial, boas práticas, arquitetura, design patterns e soluções da comunidade com foco em **alta performance e segurança**
- **Dúvida ou melhoria identificada → PARE e pergunte antes de continuar**

---

### 1. RED — Escreva o teste primeiro

```
./test/unit/<módulo>/<feature>.spec.ts       # testes unitários
./test/integration/<módulo>/<feature>.spec.ts # testes de integração
```

Cubra obrigatoriamente:

- ✅ Caminho feliz
- ✅ Erros de negócio / validação
- ✅ Recurso não encontrado
- ✅ Dados inválidos / edge cases

> Execute → todos devem **FALHAR**

---

### 2. GREEN — Implemente o mínimo

- Código mínimo para os testes passarem
- Sem abstrações prematuras

> Execute → todos devem **PASSAR**

---

### 3. REFACTOR — Melhore sem quebrar

- TypeScript strict, sem `any`
- Princípios SOLID
- Atualize barrels/index.ts se necessário

> Execute → todos devem **continuar PASSANDO**

---

## PATHS DO PROJETO

| Recurso              | Path                 |
| -------------------- | -------------------- |
| Testes unitários     | `./test/unit`        |
| Testes de integração | `./test/integration` |
| Documentação interna | `./docs`             |

---

## REGRAS

| Regra        | Detalhe                                            |
| ------------ | -------------------------------------------------- |
| Tipagem      | Strict, sem `any`                                  |
| Isolamento   | `beforeEach` para reset, sem estado entre testes   |
| Nomenclatura | `"deve [resultado] quando [condição]"`             |
| Dependências | Não instalar sem aprovação                         |
| Dúvidas      | Perguntar **antes** de assumir                     |
| Docs         | Consultar `./docs` antes de assumir comportamentos |
