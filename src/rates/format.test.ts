import { describe, expect, it } from 'vitest'
import {
  formatFixingDate,
  formatMoney,
  formatRate,
  isFixingFromToday,
  parseCzkAmount,
} from './format'

// Intl separates the code and the number with a no-break space.
const plain = (text: string) => text.replace(/\u00a0/g, ' ')

describe('parseCzkAmount', () => {
  it.each([
    ['1000', 1000],
    ['1250.50', 1250.5],
    ['1250,50', 1250.5],
    ['1 250', 1250],
    ['1\u00a0250,5', 1250.5],
    [' 42 ', 42],
    ['0', 0],
    ['1000000000', 1_000_000_000],
  ])('reads "%s" as %d', (input, value) => {
    expect(parseCzkAmount(input)).toEqual({ kind: 'valid', value })
  })

  // The value at each keystroke must not flash an error.
  it.each([
    ['12.', 12],
    ['12,', 12],
    ['.5', 0.5],
  ])('accepts half-typed "%s" as %d', (input, value) => {
    expect(parseCzkAmount(input)).toEqual({ kind: 'valid', value })
  })

  it.each(['', '   ', '.', ','])('treats "%s" as empty', (input) => {
    expect(parseCzkAmount(input)).toEqual({ kind: 'empty' })
  })

  // "1,000" is a thousand in English but 1 in Czech, so it is not guessed at.
  it.each(['abc', '-100', '1e3', '1,000', '12.345', '1,250.50'])(
    'rejects "%s"',
    (input) => {
      expect(parseCzkAmount(input)).toEqual({
        kind: 'invalid',
        message: 'Enter a number without thousands separators, e.g. 1250.50',
      })
    },
  )

  it.each(['1000000000.01', '9'.repeat(400)])(
    'rejects "%s" as too large',
    (input) => {
      expect(parseCzkAmount(input)).toEqual({
        kind: 'invalid',
        message: 'Enter at most 1,000,000,000 CZK',
      })
    },
  )
})

describe('formatMoney', () => {
  it('shows the currency code, not an ambiguous symbol', () => {
    expect(plain(formatMoney(41.0088, 'EUR'))).toBe('EUR 41.01')
    expect(plain(formatMoney(41.0088, 'USD'))).toBe('USD 41.01')
  })

  it("uses each currency's own decimal places", () => {
    expect(plain(formatMoney(7255.31, 'JPY'))).toBe('JPY 7,255')
    expect(plain(formatMoney(1234.5, 'CZK'))).toBe('CZK 1,234.50')
  })

  it('formats the IMF special drawing right (XDR)', () => {
    expect(plain(formatMoney(10, 'XDR'))).toBe('XDR 10.00')
  })
})

describe('formatRate', () => {
  it('always shows the three decimals CNB publishes', () => {
    expect(formatRate(24.385)).toBe('24.385')
    expect(formatRate(25)).toBe('25.000')
    expect(formatRate(1.2)).toBe('1.200')
  })
})

describe('formatFixingDate', () => {
  it('formats an ISO date without shifting it by time zone', () => {
    expect(formatFixingDate('2026-11-12')).toBe('12 November 2026')
    expect(formatFixingDate('2026-01-01')).toBe('1 January 2026')
  })
})

describe('isFixingFromToday', () => {
  it('is true on the fixing day in Prague', () => {
    expect(
      isFixingFromToday('2026-11-12', new Date('2026-11-12T15:00:00Z')),
    ).toBe(true)
  })

  it('is false on a later day, e.g. over the weekend', () => {
    expect(
      isFixingFromToday('2026-11-13', new Date('2026-11-15T10:00:00Z')),
    ).toBe(false)
  })

  // 23:30 UTC is already the next day in Prague (UTC+1 in November).
  it('uses the Prague date, not UTC', () => {
    expect(
      isFixingFromToday('2026-11-12', new Date('2026-11-12T23:30:00Z')),
    ).toBe(false)
  })
})
