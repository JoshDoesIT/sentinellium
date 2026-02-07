# Contributing to Sentinellium

Thank you for contributing to Sentinellium! This document outlines our development workflow and standards.

## Development Philosophy

**Test-Driven Development (TDD) is mandatory.** No exceptions.

### The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Every feature, bug fix, and refactor follows the Red-Green-Refactor cycle:

1. **RED** — Write a failing test that describes the desired behavior
2. **Verify RED** — Run the test, confirm it fails for the right reason
3. **GREEN** — Write the minimal code to make the test pass
4. **Verify GREEN** — Run all tests, confirm everything passes
5. **REFACTOR** — Clean up while keeping tests green

### Running Tests

```bash
# Unit tests (watch mode)
pnpm test

# Unit tests (single run, CI mode)
pnpm test:run

# E2E tests
pnpm test:e2e

# Full CI pipeline
pnpm ci
```

## Branch Strategy

- `main` — Protected. Requires passing CI and review.
- `feat/<description>` — New features
- `fix/<description>` — Bug fixes
- `ref/<description>` — Refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `ref`, `perf`, `docs`, `test`, `build`, `ci`, `chore`

## Code Quality

- **TypeScript strict mode** — No `any`, no implicit returns
- **ESLint** — Enforced on all TypeScript files
- **Prettier** — Enforced formatting
- **Coverage** — Minimum 90% across branches, functions, lines, statements
- **Security** — CodeQL and dependency audit on every PR

## Pull Request Checklist

- [ ] Tests written first (TDD)
- [ ] All tests pass (`pnpm test:run`)
- [ ] Type check passes (`pnpm check-types`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] No `console.log` or unused code
