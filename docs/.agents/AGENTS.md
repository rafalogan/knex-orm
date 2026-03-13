# AGENTS.md — Regras de Desenvolvimento

## FLUXO OBRIGATÓRIO: TDD (Red → Green → Refactor)

Toda tarefa de desenvolvimento deve seguir esta sequência sem exceções.

---

### ETAPA 0 — LEITURA E ANÁLISE (antes de qualquer código)

1. Leia a documentação relevante em `./docs`
2. Leia testes existentes (`./test/unit`, `./test/integration`) para entender padrões adotados
3. Pesquise na web: documentação oficial, guias de boas práticas, arquitetura, patterns e soluções da comunidade com foco em **alta performance e segurança**
4. **Se encontrar dúvida, ambiguidade ou ponto de melhoria → PARE e pergunte ao usuário**

---

### ETAPA 1 — RED

- Escreva o teste **antes** de qualquer implementação
- Paths de teste:
  - Unitários: `./test/unit/<módulo>/<nome>.spec.ts`
  - Integração: `./test/integration/<módulo>/<nome>.spec.ts`
- Cenários obrigatórios: sucesso, erro de negócio, não encontrado, dados inválidos, edge cases
- Execute e confirme que os testes **falham**

### ETAPA 2 — GREEN

- Implemente **apenas** o suficiente para os testes passarem
- Execute e confirme que os testes **passam**

### ETAPA 3 — REFACTOR

- Aplique SOLID, tipagem estrita, clean code
- Atualize exports/barrels se necessário
- Confirme que os testes **continuam passando**

---

## PATHS DE REFERÊNCIA

| Recurso              | Path                 |
| -------------------- | -------------------- |
| Testes unitários     | `./test/unit`        |
| Testes de integração | `./test/integration` |
| Documentação interna | `./docs`             |

---

## REGRAS INEGOCIÁVEIS

- Proibido `any` em TypeScript
- Testes isolados: sem estado compartilhado entre casos
- Nomes: `"deve [resultado] quando [condição]"`
- Sem novas dependências sem aprovação do usuário
- Dúvida ou melhoria → **pergunte antes de agir**
