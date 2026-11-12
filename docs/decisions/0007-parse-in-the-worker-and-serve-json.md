---
status: accepted
date: 2026-11-12
---

# Parse in the Worker and serve JSON

## Context and Problem Statement

ADR 0002 parsed the CNB file in the browser and kept the Worker a thin proxy,
as a first step (see its note). With the app working end to end, the split
showed two weaknesses. The input was checked
in two places (the Worker looked at the column header, the browser did the
real parse), and a file with a valid header but broken rows could be cached.
The public rate services we looked at (Frankfurter, Wise, XE) parse on the
server and return JSON. ADR 0002 named a second client as the reason to
revisit it; there is none, and the move is made for the reasons above.

## Considered Options

- Keep parsing in the browser (ADR 0002)
- Parse in the Worker with the same `parseDailyRates`, return `DailyRates` as JSON

## Decision Outcome

Chosen option: "Parse in the Worker", because untrusted input is then parsed
once, at the boundary where it enters the system ("parse, don't validate"):
anything that is not valid rates becomes a 502 or the last good copy
(ADR 0004) and never reaches the cache or the browser. The browser gets a
typed contract, `DailyRates`, defined once in `src/rates/parse.ts` and shared
by both sides. The parser itself did not change; it stays a pure function in
`src/rates/` with 100 % coverage, and the Worker imports it.

### Consequences

- Good, because there is one parser and one place that decides what valid
  rates are.
- Good, because the response is what the app uses, matching how public rate
  APIs (Frankfurter, Wise, XE) serve JSON with a date.
- Good, because the Worker logs rejected files, so a format change at CNB
  shows up in Workers Logs, not only as an error in someone's browser.
- Bad, because the Worker now has logic, so its tests run in workerd
  (`worker/index.test.ts`).
- Bad, because the browser trusts the JSON shape of its own API without
  checking it again; the shared type keeps both sides in step.

## More Information

- Parse, don't validate (Alexis King): https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- Frankfurter API (central bank rates as JSON): https://frankfurter.dev/
- Wise rate API: https://docs.wise.com/api-reference/rate/rateget.md
- XE Currency Data API: https://developers.xe.com/openapi/currency-data-api.json
- Workers Vitest integration: https://developers.cloudflare.com/workers/testing/vitest-integration/
