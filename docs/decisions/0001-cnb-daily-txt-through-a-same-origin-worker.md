---
status: accepted
date: 2026-11-12
---

# Load CNB daily.txt through a same-origin Worker

## Context and Problem Statement

The app must load the latest CNB rates when it starts. The browser cannot
fetch them from cnb.cz: `daily.txt` sends `Access-Control-Allow-Origin:
apl.cnb.cz`, which matches no third-party origin, and the JSON API
`api.cnb.cz` sends no CORS header and answers a preflight with 403.

## Considered Options

- `daily.txt` through our own same-origin endpoint, `GET /api/rates`
- `daily.txt` through a public CORS proxy
- The JSON API `api.cnb.cz` (typed fields, ISO date)

## Decision Outcome

Chosen option: "`daily.txt` through our own same-origin endpoint", because
the brief names `daily.txt`, a same-origin call needs no CORS setup at all,
and a public CORS proxy is a third party that can read, change or drop the
data. The JSON API has the same CORS problem, so it would not remove the proxy.

The Worker accepts only `GET` / `HEAD` on `/api/rates`, ignores query strings
(no open proxy, no cache pollution), times out after 5 s, and builds a fresh
response without CNB's headers (`Set-Cookie`, a 24 h `max-age`). What the
response contains is decided in ADR 0007, caching in ADR 0004.

### Consequences

- Good, because the browser only talks to our origin, and a failure of CNB
  never reaches it as CNB's own error page.
- Good, because the Worker caches the parsed rates for 5 minutes, so while
  CNB is up it sees about one request per 5 minutes per data centre.
- Bad, because there is server code to deploy and test (`worker/index.ts`,
  `worker/index.test.ts`).

## More Information

- OWASP, SSRF prevention (fixed destination, request built in code): https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- CNB daily.txt: https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt
- CNB JSON API: https://api.cnb.cz/cnbapi/exrates/daily?lang=EN
- MDN, Access-Control-Allow-Origin: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin
- Workers Cache API (responses with `Set-Cookie` are not cached): https://developers.cloudflare.com/workers/runtime-apis/cache/
