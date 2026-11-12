---
status: accepted
date: 2026-11-12
---

# Cache the rates to match a once-a-day fixing

## Context and Problem Statement

CNB publishes one fixing per working day, around 14:30 Prague time, and on
weekends and holidays serves the last one. TanStack Query's defaults (data
stale at once, three retries) and CNB's own headers (24 h `max-age`) both fit
this badly. The cache also decides what a visitor sees when CNB is down,
while the last fixing is still the valid one.

## Considered Options

- Short caches on both layers, plus the last good rates kept in the Worker for
  a week (Worker 5 min, TanStack Query `staleTime` 30 min, one retry)
- The same short caches, with an error whenever CNB is down
- `stale-if-error` / `stale-while-revalidate` on the response
- TanStack Query defaults, no Worker cache
- Long caches (until the next fixing)

## Decision Outcome

Chosen option: "Short caches on both layers, plus the last good rates kept in
the Worker for a week", because a new fixing shows up
within minutes of being published while CNB still gets very few requests.
Computing "until the next fixing" would need the CNB holiday calendar for a
gain nobody would notice. The app always shows the date from the file
header, never "today", so an older fixing is labelled as such.

For outages the Worker also stores each good response under a second key,
`/api/rates/last-good`, for a week (longer than any run of CNB holidays). When
CNB fails and the 5 minute copy has expired, the Worker serves that copy with
`no-store`, so the next request tries CNB again; only with no copy at all does
it answer 502. `stale-if-error` would say the same in one header, but the
Workers Cache API does not support it, and browser support is not something
to rely on.

### Consequences

- Good, because a tab left open picks up the new fixing on refocus after 30 minutes.
- Good, because a failed background refetch keeps the rates already shown.
- Good, because a CNB outage shows the last fixing, with its date, instead of
  an error; Frankfurter, a public reference-rate API, does the same
  (`stale-if-error=86400` on `api.frankfurter.dev/v2/rates`).
- Bad, because during an outage each request waits for the 5 s CNB timeout
  before it gets the last good copy.
- Bad, because the Cache API is per data centre: a location that never saw a
  good response has no copy to fall back on.
- Bad, because the zone must respect the Worker's TTL (ADR 0003).

## More Information

- TanStack Query, important defaults: https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
- Status checks, data first: https://tkdodo.eu/blog/status-checks-in-react-query
- Workers Cache API (per data centre, no `stale-if-error`): https://developers.cloudflare.com/workers/runtime-apis/cache/
- MDN, Cache-Control (`stale-if-error`): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- Frankfurter v2 rates (see its `Cache-Control`): https://api.frankfurter.dev/v2/rates?base=CZK
