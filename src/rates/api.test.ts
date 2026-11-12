import { afterEach, describe, expect, it, vi } from 'vitest'
import daily from './__fixtures__/daily-2026-11-12.txt?raw'
import { fetchRates } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchRates', () => {
  it('fetches the rates from the Worker and parses them', async () => {
    const fetchMock = vi.fn(async () => new Response(daily))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchRates()

    expect(fetchMock).toHaveBeenCalledWith('/api/rates', { signal: undefined })
    expect(result.date).toBe('2026-11-12')
    expect(result.rates).toContainEqual(
      expect.objectContaining({ code: 'JPY', amount: 100, rate: 13.783 }),
    )
  })

  it('fails on an error status instead of parsing the error body', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('CNB is unreachable', { status: 502 }),
    )
    await expect(fetchRates()).rejects.toThrow('Rates request failed (502)')
  })
})
