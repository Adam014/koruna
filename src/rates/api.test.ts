import { afterEach, describe, expect, it, vi } from 'vitest'
import daily from './__fixtures__/daily-2026-11-12.txt?raw'
import { fetchRates } from './api'
import { parseDailyRates } from './parse'

const rates = parseDailyRates(daily)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchRates', () => {
  it('fetches the parsed rates from the Worker', async () => {
    const fetchMock = vi.fn(async () => Response.json(rates))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchRates()

    expect(fetchMock).toHaveBeenCalledWith('/api/rates', { signal: undefined })
    expect(result).toEqual(rates)
  })

  it('fails on an error status instead of reading the error body', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('CNB is unreachable', { status: 502 }),
    )
    await expect(fetchRates()).rejects.toThrow('Rates request failed (502)')
  })
})
