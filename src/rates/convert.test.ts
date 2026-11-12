import { describe, expect, it } from 'vitest'
import { convertFromCzk } from './convert'
import { parseDailyRates } from './parse'
import fixture from './__fixtures__/daily-2026-11-12.txt?raw'

describe('convertFromCzk', () => {
  it('converts with a rate quoted per 1 unit', () => {
    // 24.385 CZK = 1 EUR
    expect(convertFromCzk(1000, { amount: 1, rate: 24.385 })).toBeCloseTo(
      41.0088,
      4,
    )
  })

  it('respects the quoted amount (the classic CNB mistake)', () => {
    // 13.783 CZK = 100 JPY, so 1000 CZK ≈ 7255.31 JPY, not 72.55
    expect(convertFromCzk(1000, { amount: 100, rate: 13.783 })).toBeCloseTo(
      7255.31,
      2,
    )
    // 1.208 CZK = 1000 IDR
    expect(convertFromCzk(1.208, { amount: 1000, rate: 1.208 })).toBe(1000)
  })

  it('returns 0 for 0 CZK', () => {
    expect(convertFromCzk(0, { amount: 1, rate: 24.385 })).toBe(0)
  })

  it('handles decimal CZK input', () => {
    expect(convertFromCzk(0.5, { amount: 1, rate: 25 })).toBe(0.02)
  })

  // For every real currency: paying the quoted rate in CZK buys exactly
  // `amount` units. Catches a wrong formula for any quoting unit.
  it.each(parseDailyRates(fixture).rates.map((r) => [r.code, r] as const))(
    'buys the quoted amount of %s for the quoted rate',
    (_, rate) => {
      expect(convertFromCzk(rate.rate, rate)).toBeCloseTo(rate.amount, 10)
    },
  )
})
