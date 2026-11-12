import { describe, expect, it } from 'vitest'
import {
  formatFixingDate,
  editAmountInput,
  formatAmountInput,
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
        message: 'Enter digits with up to 2 decimal places, e.g. 1 250.50',
      })
    },
  )

  it.each(['1000000000.01', '9'.repeat(400)])(
    'rejects "%s" as too large',
    (input) => {
      expect(parseCzkAmount(input)).toEqual({
        kind: 'invalid',
        message: 'Enter at most 1\u00a0000\u00a0000\u00a0000 CZK',
      })
    },
  )
})

// Group spaces are no-break spaces; tests write them as "_".
const nb = (text: string) => text.replace(/_/g, '\u00a0')

describe('formatAmountInput', () => {
  it.each([
    ['', ''],
    ['999', '999'],
    ['1000', '1_000'],
    ['1000000', '1_000_000'],
    ['1 0 0 0 0', '10_000'],
    ['1234567,5', '1_234_567.5'],
    ['12,', '12.'],
    ['1234.', '1_234.'],
    ['.5', '.5'],
  ])('formats "%s" as "%s"', (input, output) => {
    expect(formatAmountInput(input)).toBe(nb(output))
  })

  it.each(['abc', '1,000.50', '-5'])('leaves "%s" as typed', (input) => {
    expect(formatAmountInput(input)).toBe(input)
  })
})

describe('editAmountInput', () => {
  it('keeps the caret after the typed digit when a group appears', () => {
    // "100|" + "0" -> "1_000|"
    expect(editAmountInput('100', '1000', 4, 'insertText')).toEqual({
      text: nb('1_000'),
      caret: 5,
    })
    // "1_0|00" + "5" -> "10_5|00"
    expect(editAmountInput(nb('1_000'), nb('1_0500'), 4, 'insertText')).toEqual(
      {
        text: nb('10_500'),
        caret: 4,
      },
    )
  })

  it('deletes the digit before a group space on Backspace', () => {
    // "1_|000" Backspace removes the space; the "1" goes with it.
    expect(
      editAmountInput(nb('1_000'), '1000', 1, 'deleteContentBackward'),
    ).toEqual({ text: '000', caret: 0 })
  })

  it('deletes the digit after a group space on Delete', () => {
    // "1|_000" Delete removes the space; the next "0" goes with it.
    expect(
      editAmountInput(nb('1_000'), '1000', 1, 'deleteContentForward'),
    ).toEqual({ text: '100', caret: 1 })
  })

  it('formats a paste and puts the caret at its end', () => {
    expect(editAmountInput('', '2500000', 7, 'insertFromPaste')).toEqual({
      text: nb('2_500_000'),
      caret: 9,
    })
  })
})

describe('formatMoney', () => {
  it('shows the currency code, not an ambiguous symbol', () => {
    expect(plain(formatMoney(41.0088, 'EUR'))).toBe('EUR 41.01')
    expect(plain(formatMoney(41.0088, 'USD'))).toBe('USD 41.01')
  })

  it("uses each currency's own decimal places", () => {
    expect(plain(formatMoney(7255.31, 'JPY'))).toBe('JPY 7 255')
    expect(plain(formatMoney(1234.5, 'CZK'))).toBe('CZK 1 234.50')
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
