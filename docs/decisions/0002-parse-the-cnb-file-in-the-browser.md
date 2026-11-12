---
status: superseded by 0007
date: 2026-11-12
---

# Parse the CNB file in the browser

> Superseded by [ADR 0007](0007-parse-in-the-worker-and-serve-json.md). This
> was a deliberate first step: get the parser right as a pure, fully tested
> function with no server logic, then decide where it runs. Once the parser
> was proven, it moved to the Worker. The record is kept to show the trade-off.

## Context and Problem Statement

The CNB file is pipe-separated text. It has to be turned into typed rates
somewhere: in the Worker (which would then return JSON) or in the app.

## Considered Options

- The Worker forwards the text; the app parses it (`src/rates/parse.ts`)
- The Worker parses it and returns JSON

## Decision Outcome

Chosen option: "The app parses it", because it keeps the Worker a thin,
validating proxy and keeps all domain logic in one place: pure functions in
`src/rates/` with 100 % test coverage against a real CNB file. The file is
about 2 KB, so JSON would save nothing, and there is no other client of the
API that would need a JSON contract.

### Consequences

- Good, because parsing, conversion and formatting are tested together, in
  plain Vitest, without the Workers runtime.
- Good, because the Worker has no logic beyond HTTP and caching.
- Bad, because the Worker checks only the column header line. A file that has
  the header but broken rows is cached for 5 minutes; the app then shows the
  same "Could not load" error with a retry as for any other failure.
- Revisit if a second client needs the rates: the Worker can import the same
  `parseDailyRates` and return JSON.

## More Information

- CNB format: https://www.cnb.cz/en/faq/Format-of-the-foreign-exchange-market-rates/
- TanStack Query, query functions (parsing inside `queryFn`): https://tanstack.com/query/latest/docs/framework/react/guides/query-functions
