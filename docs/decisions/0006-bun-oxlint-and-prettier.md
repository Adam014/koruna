---
status: accepted
date: 2026-11-12
---

# Bun, oxlint and Prettier for tooling

## Context and Problem Statement

The project starts from the official Vite 8 template, which uses TypeScript 7
and oxlint. It needs a package manager, a linter, a formatter and a test
runner that work with TypeScript 7.

## Considered Options

- Bun as package manager and script runner; oxlint; Prettier; Vitest
- pnpm; ESLint with typescript-eslint; Prettier
- Biome for lint and format

## Decision Outcome

Chosen option: "Bun, oxlint, Prettier, Vitest", because oxlint is what the
Vite template ships and works with TypeScript 7 directly, while
typescript-eslint supports only TypeScript below 6.1. Biome would add a second
toolchain next to Oxc, and oxfmt is still 0.x, so Prettier formats. Bun is one
tool for installing, running scripts and `bunx`, pinned by `packageManager`
with a text lockfile, and matches the author's other projects; Vitest stays the test
runner because it is built on Vite and has jsdom and a Workers integration.

### Consequences

- Good, because the setup is the template plus a formatter, not a custom stack.
- Good, because types are checked by `tsc -b` in CI and in a Claude Code hook,
  so lint does not need type information.
- Bad, because `bun test` starts Bun's own runner, not Vitest; the scripts
  (`bun run test`) and `AGENTS.md` say so.
- Revisit when typescript-eslint supports TypeScript 7.

## More Information

- create-vite (template contents): https://registry.npmjs.org/create-vite/latest
- typescript-eslint, supported TypeScript versions: https://typescript-eslint.io/users/dependency-versions
- Oxc formatter: https://oxc.rs/docs/guide/usage/formatter
- Vitest: https://vitest.dev/guide/
- Bun, package manager: https://bun.sh/docs/cli/install
- Bun, test runner: https://bun.sh/docs/cli/test
