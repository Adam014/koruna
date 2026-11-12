import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import daily from '../src/rates/__fixtures__/daily-2026-11-12.txt?raw'
import worker from './index'

const ORIGIN = 'https://momence.stadnik.dev'

// The Worker's outbound fetch to CNB is replaced, so no test calls cnb.cz.
// Every call gets a fresh copy: a response body can be read only once.
function cnbAnswers(response: Response | Error) {
  const upstream = vi.fn<typeof fetch>(() =>
    response instanceof Error
      ? Promise.reject(response)
      : Promise.resolve(response.clone()),
  )
  vi.stubGlobal('fetch', upstream)
  return upstream
}

async function call(path: string, method = 'GET') {
  // Typed as the request a Worker receives, as in the Cloudflare example.
  // https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/
  const request = new Request<unknown, IncomingRequestCfProperties>(
    `${ORIGIN}${path}`,
    { method },
  )
  const ctx = createExecutionContext()
  const response = await worker.fetch(request, env, ctx)
  await waitOnExecutionContext(ctx)
  return response
}

afterEach(async () => {
  vi.unstubAllGlobals()
  await caches.default.delete(`${ORIGIN}/api/rates`)
})

describe('GET /api/rates', () => {
  it('returns the CNB file without CNB headers and caches it briefly', async () => {
    cnbAnswers(
      new Response(daily, {
        headers: { 'Set-Cookie': 'TS01=x', 'Cache-Control': 'max-age=86400' },
      }),
    )

    const response = await call('/api/rates')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(daily)
    expect(response.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    )
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Set-Cookie')).toBeNull()
  })

  it('serves the next request from the cache, whatever the query string', async () => {
    const upstream = cnbAnswers(new Response(daily))

    await call('/api/rates')
    const second = await call('/api/rates?date=01.01.2000')

    expect(upstream).toHaveBeenCalledOnce()
    expect(await second.text()).toBe(daily)
  })

  it('answers HEAD with the headers only', async () => {
    cnbAnswers(new Response(daily))

    const response = await call('/api/rates', 'HEAD')

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    expect(await response.text()).toBe('')
  })

  it.each([
    [
      'CNB is unreachable',
      new TypeError('network error'),
      'CNB is unreachable',
    ],
    [
      'CNB fails',
      new Response('Down', { status: 503 }),
      'CNB responded with 503',
    ],
    [
      'CNB returns a page that is not the rates file',
      new Response('<html>Request rejected</html>'),
      'CNB returned an unexpected format',
    ],
  ])('returns 502 and caches nothing when %s', async (_, answer, message) => {
    const upstream = cnbAnswers(answer)

    const response = await call('/api/rates')

    expect(response.status).toBe(502)
    expect(await response.text()).toBe(message)
    expect(response.headers.get('Cache-Control')).toBe('no-store')

    // The failure was not cached: the next request asks CNB again.
    await call('/api/rates')
    expect(upstream).toHaveBeenCalledTimes(2)
  })
})

describe('other requests', () => {
  it('rejects methods other than GET and HEAD', async () => {
    const response = await call('/api/rates', 'POST')

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET, HEAD')
  })

  it('answers unknown API paths with 404', async () => {
    const response = await call('/api/other')

    expect(response.status).toBe(404)
  })
})
