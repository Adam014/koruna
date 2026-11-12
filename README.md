# Koruna

Daily exchange rates of the Czech National Bank (CNB) and a converter from
Czech koruna (CZK) into any of the listed currencies.

**Live:** https://momence.stadnik.dev

## What it does

- Loads the latest CNB fixing on start and shows the date it is valid for.
  On weekends and holidays CNB serves the last fixing, so the app shows the
  date from the file, never "today".
- Lists every rate in a table, with the unit CNB quotes it for
  (`100 JPY = 13.783 CZK`).
- Converts CZK into the chosen currency in real time, as you type. The amount
  field accepts `1250.50`, `1 250,50` and similar, and explains invalid input.
- Loading, error (with retry) and light / dark states; works on phones and
  with a keyboard and screen reader.

## Where to look

| What                    | Where                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Scope (the brief)       | [`docs/requirements.md`](docs/requirements.md)                                                  |
| Decisions and why       | [`docs/decisions/`](docs/decisions/) (below)                                                    |
| Parsing the CNB file    | [`src/rates/parse.ts`](src/rates/parse.ts)                                                      |
| Conversion              | [`src/rates/convert.ts`](src/rates/convert.ts)                                                  |
| Input and number format | [`src/rates/format.ts`](src/rates/format.ts)                                                    |
| Data fetching (Query)   | [`src/rates/api.ts`](src/rates/api.ts)                                                          |
| UI                      | [`src/components/`](src/components/), theme in [`src/theme/`](src/theme/)                       |
| Server (CNB proxy)      | [`worker/index.ts`](worker/index.ts), config in [`wrangler.jsonc`](wrangler.jsonc)              |
| Tests                   | `*.test.ts(x)` next to the code, [`worker/index.test.ts`](worker/index.test.ts), [`e2e/`](e2e/) |
| CI and deploy           | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                          |
| Conventions, commands   | [`AGENTS.md`](AGENTS.md)                                                                        |
| AI agent setup          | [`CLAUDE.md`](CLAUDE.md), [`.claude/`](.claude/)                                                |

## Run it

Requires [Bun](https://bun.sh) 1.3 and Node 22.12+ (`.nvmrc` pins 26).

```sh
bun install
bun run dev        # http://localhost:5173, the Worker runs inside Vite
```

| Command                 | Does                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `bun run test`          | Unit and component tests (Vitest), Worker tests in workerd  |
| `bun run test:coverage` | The same with coverage; `src/rates/` must stay at 100 %     |
| `bun run test:e2e`      | End-to-end test in Chromium, Firefox, WebKit and two phones |
| `bun run typecheck`     | TypeScript over the app, the Worker and the config          |
| `bun run lint`          | oxlint                                                      |
| `bun run format:check`  | Prettier                                                    |
| `bun run build`         | Typecheck and production build into `dist/`                 |

Before the first e2e run: `bunx playwright install chromium firefox webkit`.
Use `bun run test`, not `bun test`: the latter is Bun's own test runner.

## How it works

```
browser ──GET /api/rates──▶ Worker ──▶ cnb.cz daily.txt
   │          (JSON)          │
   │                          └ parses, caches 5 min, keeps the last good copy
   └ converts, renders (React + TanStack Query)
```

- **Same-origin proxy.** The browser cannot call cnb.cz directly: its CORS
  header never allows a third-party origin. A small Cloudflare Worker fetches
  the file, parses it and returns the rates as JSON. It only answers
  `GET /api/rates`, ignores query strings (no open proxy, no cache pollution)
  and times out after 5 s.
- **Parsing at the boundary.** The Worker parses the file with the same pure,
  fully unit tested function the rest of the domain logic lives next to
  (`src/rates/`). A file that is not valid rates never reaches the cache or
  the browser. The first version parsed in the browser; ADR 0007 explains the
  move.
- **The `Amount` column.** CNB quotes some currencies per 100 or 1000 units
  (JPY, HUF, IDR…), so the conversion is `czk * amount / rate`, not
  `czk / rate`.
- **Caching.** CNB publishes once per working day around 14:30. The Worker
  caches the rates for 5 minutes and keeps the last good copy for a week: if
  CNB is down, visitors get that copy, labelled with its fixing date, instead
  of an error. TanStack Query treats the rates as fresh for 30 minutes and
  retries a failed load once; a failed background refetch keeps the rates
  already shown.
- **Hosting.** One Cloudflare Worker serves the built app as static assets and
  the API. CI deploys it from `main` only after every check passes, then
  smoke tests the live site.

## Decisions

Recorded as [MADR](https://adr.github.io/madr/) records with sources:

1. [Load CNB daily.txt through a same-origin Worker](docs/decisions/0001-cnb-daily-txt-through-a-same-origin-worker.md)
2. [Parse the CNB file in the browser](docs/decisions/0002-parse-the-cnb-file-in-the-browser.md) (superseded by 0007)
3. [Host on Cloudflare Workers, deploy from GitHub Actions](docs/decisions/0003-cloudflare-workers-deployed-from-ci.md)
4. [Cache the rates to match a once-a-day fixing](docs/decisions/0004-cache-the-rates-for-a-daily-fixing.md)
5. [Money as a float, rounded once by Intl](docs/decisions/0005-money-as-float-rounded-once-by-intl.md)
6. [Bun, oxlint and Prettier for tooling](docs/decisions/0006-bun-oxlint-and-prettier.md)
7. [Parse in the Worker and serve JSON](docs/decisions/0007-parse-in-the-worker-and-serve-json.md)

## Tests

- **Unit** (`src/rates/`): parser (including malformed files), conversion,
  input parsing and number formatting. 100 % coverage, enforced in CI.
- **Components** (Testing Library, jsdom): the converter, the rates table,
  the theme switch and the whole app with loading, error and retry.
- **Worker** (`@cloudflare/vitest-plugin`, in workerd): JSON and headers,
  caching, HEAD, 404 / 405, the last good copy when CNB is down, and 502 when
  there is none.
- **End to end** (Playwright): the main flow against the production build in
  three browser engines and on two phones. `/api/rates` is served from the
  parsed fixture so the test is deterministic.

## Stack

React 19 with Hooks, TypeScript (strict), styled-components, TanStack Query,
Vite. Vitest, Testing Library and Playwright for tests; oxlint and Prettier;
Cloudflare Workers for hosting; GitHub Actions for CI with Dependabot.
