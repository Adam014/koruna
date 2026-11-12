// Same-origin proxy for the CNB daily rates. The browser cannot call cnb.cz directly
// (its Access-Control-Allow-Origin header never matches a third-party origin), so this
// Worker fetches the file and returns the plain text. Parsing happens in the app.

const CNB_DAILY_URL =
  'https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt'

// Column header of the CNB file. If it is missing, CNB returned something else
// (an error or firewall page), which must not be cached and served as rates.
const CNB_HEADER = 'Country|Currency|Amount|Code|Rate'

// CNB publishes once per working day (~14:30 CET); a few minutes is fresh enough.
const CACHE_SECONDS = 300
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

export default {
  async fetch(request, _env, ctx): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname !== '/api/rates') {
      return error(404, 'Not found')
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return error(405, 'Method not allowed', { Allow: 'GET, HEAD' })
    }

    // Ignore query strings so callers cannot bypass or pollute the cache.
    const cacheKey = new Request(`${url.origin}/api/rates`)
    const cache = caches.default
    let response = await cache.match(cacheKey)

    if (!response) {
      let upstream: Response
      try {
        upstream = await fetch(CNB_DAILY_URL, {
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        })
      } catch {
        return error(502, 'CNB is unreachable')
      }
      if (!upstream.ok) {
        return error(502, `CNB responded with ${upstream.status}`)
      }

      const body = await upstream.text()
      if (!body.includes(CNB_HEADER)) {
        return error(502, 'CNB returned an unexpected format')
      }

      // Build a fresh response: CNB's own headers (Set-Cookie, a 24h max-age) are dropped.
      response = new Response(body, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
          'X-Content-Type-Options': 'nosniff',
        },
      })
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
    }

    if (request.method === 'HEAD') {
      return new Response(null, { headers: response.headers })
    }
    return response
  },
} satisfies ExportedHandler<Env>
