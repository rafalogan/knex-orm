## Overview

This document explains how to contribute to knex-orm following the rules defined in:

- `.rules`
- `docs/DEVELOPMENT.md`
- `docs/COMMITS_RULES.md`

The goal is to keep code quality high, architecture consistent and the user experience predictable.

---

## Environment setup

1. **Fork** the repository on GitHub.
2. **Clone** your fork:

   ```bash
   git clone https://github.com/<your-username>/knex-orm.git
   cd knex-orm
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Validate the environment**:

   ```bash
   npm test
   npm run build
   ```

Make sure tests pass and the build succeeds before starting to modify code.

---

## Contribution workflow

1. Create a branch for your change:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make small, cohesive changes.
3. Write tests first (TDD) and validate with `npm test`.
4. Ensure lint and formatting are clean:

   ```bash
   npm run lint
   npm run format:check
   ```

5. Use **Conventional Commits** (see next section).
6. Push your branch to your fork:

   ```bash
   git push origin feat/my-feature
   ```

7. Open a **Pull Request** against the main repository, describing:
   - The problem being solved
   - What changed
   - How to test it

---

## Commits

Full rules are in `docs/COMMITS_RULES.md`.  
Summary:

- Commit messages **must be in English**.
- Format:

  ```text
  <type>(<scope>): <subject>
  ```

- Common types:
  - `feat` — new feature
  - `fix` — bug fix
  - `docs` — documentation
  - `refactor` — refactor with no behavioral change
  - `perf` — performance optimization
  - `test` — tests
  - `build`, `ci`, `chore`, `security`, `revert`
- Examples:

  ```text
  feat(repository): add soft delete support
  fix(migration): handle addIndex operation
  docs: add pt/en usage guide
  test(connection): cover initializeFromPath error cases
  ```

Use `BREAKING CHANGE:` in the footer when you introduce incompatible changes.

---

## Code style

Style rules are centralized in `.rules` and detailed in `docs/DEVELOPMENT.md`:

- TypeScript **strict** — no `any` (explicit or implicit).
- Names in English for code (classes, functions, variables); comments may be in Portuguese when needed.
- `camelCase` for variables/properties; `snake_case` for table/column names.
- Decorators:
  - Do not contain business logic — they only register metadata.
  - Validate inputs (e.g. `@Entity` must be used on constructors).
  - Throw `TypeError` on invalid usage.
- Comments only when the **why** is not obvious from the code.

Always run:

```bash
npm run lint
npm run format
```

before opening a PR (or configure your editor to run ESLint and formatting automatically).

---

## Tests and quality

Before submitting a PR:

1. Run the test suite:

   ```bash
   npm test
   npm run test:bun
   ```

2. For larger changes, check coverage:

   ```bash
   npm run test:coverage
   ```

3. Ensure global thresholds defined in `jest.config.js` are still met.
4. Add tests for:
   - New features (unit and/or integration).
   - Bug fixes (regression tests).

Existing tests under `test/unit/**` and `test/integration/**` are the best reference for style and structure.

---

## Review process

When opening a PR:

- Clearly describe:
  - The problem / feature
  - Current vs expected behavior
  - How to test (commands, scenarios)
- Keep the PR **focused**:
  - Avoid mixing large refactors with new features.
  - Avoid pure formatting changes mixed with behavioral changes.
- Address review feedback with additional, clear commits (keeping history readable).

Reviewers will mainly look at:

- Test coverage
- Clarity of changes
- Adherence to the architecture (Core vs Adapters vs NestJS vs CLI)
- Impact on performance and security

---

## Reporting bugs and requesting features

Use the repository’s issues page (set in `package.json`):

- Issues/bugs URL: `https://github.com/knex-orm/knex-orm/issues`

When opening a bug report:

- Include:
  - `knex-orm` version
  - Environment (Node/Bun, DB, OS)
  - Steps to reproduce
  - Expected vs actual result
  - Relevant logs (without secrets)

For feature requests:

- Explain the use case
- Compare with what exists in other tools (TypeORM/Prisma/MikroORM, etc.)
- Indicate whether you are willing to help with implementation

---

## Code of conduct (summary)

Even though there is no dedicated Code of Conduct file in this repository, follow these principles:

- Absolute respect between participants (no personal attacks, harassment or toxic language).
- Focus on technical solutions and observable behavior.
- Openness to feedback and constructive criticism.
- Zero tolerance for any kind of discrimination.

Violations may result in contribution blocks and/or platform‑level reports.

