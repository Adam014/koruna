// Same-origin API for the CNB daily rates. The browser cannot call cnb.cz directly
// (its Access-Control-Allow-Origin header never matches a third-party origin), so this
// Worker fetches the file, parses it and returns the rates as JSON.
// docs/decisions/0001, 0007 and 0004.

import { parseDailyRates, type DailyRates } from '../src/rates/parse'

const CNB_DAILY_URL =
  'https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt'

// CNB publishes once per working day (~14:30 CET); a few minutes is fresh enough.
const CACHE_SECONDS = 300
// How long the last good rates stay available for when CNB is down. A week
// covers the longest run of CNB holidays.
const LAST_GOOD_SECONDS = 7 * 24 * 60 * 60
const UPSTREAM_TIMEOUT_MS = 5000

function error(
  status: number,
  message: string,
  headers?: Record<string, string>,
): Response {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

function json(rates: DailyRates, cacheControl: string): Response {
  return new Response(JSON.stringify(rates), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function loadFromCnb(): Promise<
  { ok: true; rates: DailyRates } | { ok: false; message: string }
> {
  let upstream: Response
  try {
    upstream = await fetch(CNB_DAILY_URL, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, message: 'CNB is unreachable' }
  }
  if (!upstream.ok) {
    return { ok: false, message: `CNB responded with ${upstream.status}` }
  }
  try {
    return { ok: true, rates: parseDailyRates(await upstream.text()) }
  } catch (cause) {
    // An error or firewall page instead of the rates file. Logged for
    // Workers Logs; the client only needs to know the rates are unavailable.
    console.error('CNB returned an unexpected format', cause)
    return { ok: false, message: 'CNB returned an unexpected format' }
  }
}

export default {
  async fetch(request, _env, ctx): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname !== '/api/rates') {
      return error(404, 'Not found')
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return error(405, 'Method not allowed', { Allow: 'GET, HEAD' })
    }

    // Fixed keys, query strings ignored, so callers cannot bypass or pollute
    // the cache. The Cache API has no stale-if-error, so the last good rates
    // are kept under a key of their own. The keys are not "/api/rates": the
    // earlier Worker cached plain text there, and cache entries survive a
    // deploy, so the new Worker would serve that text for up to 5 minutes.
    // https://developers.cloudflare.com/workers/runtime-apis/cache/
    const freshKey = new Request(`${url.origin}/api/rates/json`)
    const lastGoodKey = new Request(`${url.origin}/api/rates/last-good`)
    const cache = caches.default
    let response = await cache.match(freshKey)

    if (!response) {
      const result = await loadFromCnb()
      if (result.ok) {
        response = json(result.rates, `public, max-age=${CACHE_SECONDS}`)
        ctx.waitUntil(
          Promise.all([
            cache.put(freshKey, response.clone()),
            cache.put(
              lastGoodKey,
              json(result.rates, `max-age=${LAST_GOOD_SECONDS}`),
            ),
          ]),
        )
      } else {
        const lastGood = await cache.match(lastGoodKey)
        if (!lastGood) return error(502, result.message)
        // CNB is down: serve the last good rates. The app shows their fixing
        // date, and no-store makes the next request try CNB again.
        response = new Response(lastGood.body, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }
    }

    if (request.method === 'HEAD') {
      return new Response(null, { headers: response.headers })
    }
    return response
  },
} satisfies ExportedHandler<Env>
