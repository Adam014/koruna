# AGENTS.md

Koruna shows the Czech National Bank (CNB) daily exchange rates and converts CZK
into a selected currency. React SPA + a small Cloudflare Worker, served at
https://momence.stadnik.dev. Reviewers read the code, the commits and the docs,
so all three must stay clean.

## Sources of truth (in this order)

1. `docs/requirements.md` – scope. Nothing outside it gets built.
2. `docs/decisions/` – Architecture Decision Records (MADR). Follow them; to change
   one, write a new ADR that supersedes it.
3. This file – commands, domain rules, conventions, process.
4. `docs/research/` – local research notes and report with cited sources
   (gitignored, may be missing in a fresh clone). Read the report before
   proposing tooling or architecture changes.

## Commands

Bun is the package manager and script runner (`packageManager` in `package.json`).

- `bun install` – install dependencies (commit `bun.lock`)
- `bun run dev` – Vite dev server; the Worker runs inside it via `@cloudflare/vite-plugin`
- `bun run typecheck` – `tsc -b` over app, Node config and Worker
- `bun run lint` – oxlint
- `bun run format` / `bun run format:check` – Prettier
- `bun run build` – typecheck + production build into `dist/`
- `bun run cf-typegen` – regenerate `worker-configuration.d.ts` after changing `wrangler.jsonc`

CI (`.github/workflows/ci.yml`) runs the same checks on every PR and push. On
`main` it deploys the verified build to the `production` environment and smoke
tests https://momence.stadnik.dev. Actions are pinned by SHA; Dependabot keeps
them and the dependencies current.

## Layout

- `src/` – the React app (browser)
- `worker/index.ts` – the only server code: `GET /api/rates` proxies CNB `daily.txt`
- `wrangler.jsonc` – Worker config: static assets, SPA fallback, custom domain
- `docs/` – requirements, decisions, local research

## Domain rules (easy to get wrong)

- CNB rates are quoted per `Amount` units (JPY, HUF… per 100, IDR per 1000).
  Convert as `czk * amount / rate`, never `czk / rate`.
- The English `daily.txt` header date looks like `12 Nov 2026 #218`, not the
  `DD.MM.YYYY` from the CNB docs.
- On weekends and holidays CNB silently returns the last fixing. Show the date
  from the file header, never "today".
- The browser cannot call cnb.cz (no usable CORS); always go through `/api/rates`.
- Parsing and conversion live in `src/` as pure functions; the Worker only
  validates and forwards text.
- The zone `stadnik.dev` has a Cache Rule "respect origin TTL" for
  `momence.stadnik.dev`; without it Cloudflare rewrites `max-age` to 4 hours.

## Conventions

- TypeScript strict with `noUncheckedIndexedAccess`; no `any`, no non-null `!`.
- Stack is fixed by the brief (R7). Do not add other UI or state libraries.
- TanStack Query: `queryOptions`, explicit loading / error / empty states,
  `staleTime` matched to a once-a-day fixing.
- styled-components: transient `$props`; theme typed via `DefaultTheme`.
- UI: text never smaller than 14 px; every clickable element has `cursor: pointer`;
  no icons on decorative background shapes.
- Design: Inter (variable, self-hosted via `@fontsource-variable/inter`); gold
  accent from the logo, `#c8901a` light / `#f2b93b` dark, `#8a5d0b` for gold text
  on light backgrounds (contrast). Light and dark mode.
- Keep it simple: no abstraction without a second use, no speculative options.
- Docs are English, short and specific. No company or person names from the brief.

## How we work

1. **One step at a time.** Each step is one small, reviewable change that becomes
   one Conventional Commit (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
2. **Verify, don't guess.** Versions, APIs and config options come from the
   official docs or the npm registry, not from memory. If something cannot be
   verified, say so explicitly.
3. **Review before proposing a commit** (`/review-change`): check the diff against
   the requirements, the ADRs, this file and the research, and run
   `typecheck`, `lint`, `format:check` and `build`.
4. **UI changes are checked in a real browser** (light, dark, phone width) before
   they are called done, including `cursor: pointer` on every clickable element.
5. **Report briefly**: what changed, what was verified, what is open.
6. **The human approves.** Never commit, push or deploy without explicit approval.
   Production deploys run from CI after checks pass.
7. **Record hard-to-reverse decisions** as an ADR (`/new-adr`), with sources.

## Git and infrastructure rules

- Never stage on your own (`git add`, `git mv`, `git rm`): move or delete files with
  plain filesystem commands. Staging happens only as part of an approved commit.
- No `Co-Authored-By` or "Generated with" lines in commits or PRs.
- Never `git push`, never force-push, never write to the remote. The human pushes.
- Before stating anything about the repo state, run `git status` and `git log`.
- Never change Cloudflare or DNS settings; give the human exact dashboard steps.
- Only one agent edits the working tree at a time.

## Reference docs

- CNB: [format](https://www.cnb.cz/en/faq/Format-of-the-foreign-exchange-market-rates/),
  [daily.txt](https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt)
- TanStack Query: [important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults),
  [TypeScript](https://tanstack.com/query/latest/docs/framework/react/typescript),
  [testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing),
  [queryOptions (TkDodo)](https://tkdodo.eu/blog/the-query-options-api)
- styled-components: [API](https://styled-components.com/docs/api),
  [FAQ](https://styled-components.com/docs/faqs)
- Money formatting: [Intl.NumberFormat (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
- Cloudflare Workers: [static assets](https://developers.cloudflare.com/workers/static-assets/),
  [Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/),
  [wrangler config](https://developers.cloudflare.com/workers/wrangler/configuration/)
- Testing: [Vitest](https://vitest.dev/guide/), [Testing Library queries](https://testing-library.com/docs/queries/about/),
  [Playwright CI](https://playwright.dev/docs/ci-intro)
- Process: [MADR](https://adr.github.io/madr/), [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/),
  [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use)
