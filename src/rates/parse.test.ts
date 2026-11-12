import { describe, expect, it } from 'vitest'
import { RatesParseError, parseDailyRates } from './parse'
// Real file served by CNB on 12 Nov 2026.
import fixture from './__fixtures__/daily-2026-11-12.txt?raw'

// Builds a minimal CNB file: date line, column header, rows.
function cnbFile(rows: string[], dateLine = '12 Nov 2026 #218'): string {
  return [dateLine, 'Country|Currency|Amount|Code|Rate', ...rows].join('\n')
}

const EUR = 'EMU|euro|1|EUR|24.385'

describe('parseDailyRates', () => {
  describe('the real CNB file', () => {
    const result = parseDailyRates(fixture)

    it('reads the fixing date and sequence number', () => {
      expect(result.date).toBe('2026-11-12')
      expect(result.sequence).toBe(218)
    })

    it('reads every row with all fields', () => {
      expect(result.rates).toHaveLength(30)
      expect(result.rates[0]).toEqual({
        country: 'Australia',
        currency: 'dollar',
        amount: 1,
        code: 'AUD',
        rate: 15.011,
      })
      expect(result.rates.at(-1)).toEqual({
        country: 'USA',
        currency: 'dollar',
        amount: 1,
        code: 'USD',
        rate: 22.014,
      })
    })

    it('keeps the quoted amount for currencies not quoted per 1 unit', () => {
      const amountOf = (code: string) =>
        result.rates.find((r) => r.code === code)?.amount

      expect(amountOf('EUR')).toBe(1)
      expect(amountOf('JPY')).toBe(100)
      expect(amountOf('HUF')).toBe(100)
      expect(amountOf('IDR')).toBe(1000)
    })

    it('keeps names with spaces', () => {
      const ils = result.rates.find((r) => r.code === 'ILS')
      expect(ils?.currency).toBe('new shekel')
      expect(result.rates.find((r) => r.code === 'GBP')?.country).toBe(
        'United Kingdom',
      )
    })

    it('has unique codes, known amounts and positive rates', () => {
      const codes = result.rates.map((r) => r.code)
      expect(new Set(codes).size).toBe(codes.length)
      for (const { amount, rate } of result.rates) {
        expect([1, 100, 1000]).toContain(amount)
        expect(rate).toBeGreaterThan(0)
      }
    })
  })

  describe('date line', () => {
    it.each([
      ['3 Jan 2025 #2', '2025-01-03', 2],
      ['31 Dec 2026 #250', '2026-12-31', 250],
      ['29 Feb 2028 #41', '2028-02-29', 41],
    ])('parses "%s"', (dateLine, date, sequence) => {
      expect(parseDailyRates(cnbFile([EUR], dateLine))).toMatchObject({
        date,
        sequence,
      })
    })

    it.each([
      ['the DD.MM.YYYY form from the docs', '12.11.2026 #218'],
      ['an unknown month', '12 Foo 2026 #218'],
      ['a non-existent day', '31 Nov 2026 #218'],
      ['day zero', '0 Nov 2026 #218'],
      ['29 Feb in a non-leap year', '29 Feb 2026 #40'],
      ['a missing sequence number', '12 Nov 2026'],
    ])('rejects %s', (_, dateLine) => {
      expect(() => parseDailyRates(cnbFile([EUR], dateLine))).toThrow(
        RatesParseError,
      )
    })
  })

  describe('file structure', () => {
    it('handles Windows line endings, blank lines and padding', () => {
      const text = `\n  ${cnbFile([EUR]).replaceAll('\n', '\r\n')}  \r\n\r\n`
      expect(parseDailyRates(text).rates).toHaveLength(1)
    })

    it.each([
      ['an empty file', ''],
      ['a whitespace-only file', ' \n \n'],
      ['an HTML error page', '<!doctype html><html><body>Error</body></html>'],
      ['a wrong column header', `12 Nov 2026 #218\nfoo|bar\n${EUR}`],
      ['a missing column header', `12 Nov 2026 #218\n${EUR}`],
      ['a file without rates', cnbFile([])],
    ])('rejects %s', (_, text) => {
      expect(() => parseDailyRates(text)).toThrow(RatesParseError)
    })
  })

  describe('rate rows', () => {
    it('accepts integer rates', () => {
      expect(parseDailyRates(cnbFile(['X|y|1|ABC|25'])).rates[0]?.rate).toBe(25)
    })

    it.each([
      ['a missing column', 'EMU|euro|1|24.385'],
      ['an extra column', 'EMU|euro|1|EUR|24.385|x'],
      ['a zero amount', 'EMU|euro|0|EUR|24.385'],
      ['an empty amount', 'EMU|euro||EUR|24.385'],
      ['a comma decimal rate (Czech file format)', 'EMU|euro|1|EUR|24,385'],
      ['a zero rate', 'EMU|euro|1|EUR|0'],
      ['a negative rate', 'EMU|euro|1|EUR|-24.385'],
      ['an empty rate', 'EMU|euro|1|EUR|'],
      ['an invalid currency code', 'EMU|euro|1|EURO|24.385'],
    ])('rejects %s', (_, row) => {
      expect(() => parseDailyRates(cnbFile([EUR, row]))).toThrow(
        RatesParseError,
      )
    })

    it('names the offending line in the error', () => {
      expect(() => parseDailyRates(cnbFile(['EMU|euro|1|EUR|abc']))).toThrow(
        'Invalid rate: "EMU|euro|1|EUR|abc"',
      )
    })
  })
})
