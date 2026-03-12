# Commit Rules

> Conventional Commits for agents and humans. All commit messages MUST be in English.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- **Subject**: imperative mood, ≤72 chars (prefer ≤50), no trailing period
- **Body**: explain "why" when necessary; required for security/perf impact
- **Footer**: `Closes #123`, `Refs #456`; `BREAKING CHANGE:` when applicable

## Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `build`    | Build system, dependencies                              |
| `ci`       | CI/CD configuration                                     |
| `chore`    | Maintenance (e.g. tooling)                              |
| `revert`   | Revert a previous commit                                |
| `security` | Security fix or hardening                               |

## Rules

### Atomicity

- **One logical intention per commit**
- No "misc" or "various fixes"
- Separate refactor/format from functional changes
- Each commit must be **verifiable** (run tests/lint when available)

### Documentation

- Changes in `docs/` or `README*` → use `docs:` type
- Example: `docs: add commit rules to README`

### Security & Performance

- Explicitly describe impact and mitigation in the body when relevant
- Avoid broad changes without justification
- Prefer small, reviewable, reversible changes

### Examples

```
feat(repository): add soft delete support
fix(metadata): resolve circular reference in decorators
docs: add COMMITS_RULES.md
refactor(adapters): extract connection pool logic
perf(query): optimize N+1 in find with relations
test(repository): add integration tests for disable()
build: add tsup for dual ESM/CJS output
ci: add Bun test job to workflow
chore: update tsconfig paths
security(knex): sanitize raw query inputs
```

### Breaking Changes

```
feat(api)!: change save() signature

BREAKING CHANGE: save() now requires where clause for updates.
Use create() for inserts.
```

## References

- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [Semantic Versioning (SemVer)](https://semver.org/)
- [7 rules of a great commit message](https://cbea.ms/git-commit/) (Chris Beams)
- [GitHub Docs writing best practices](https://docs.github.com/en/contributing/writing-for-github-docs/best-practices-for-github-docs)
