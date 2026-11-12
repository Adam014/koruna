// Turning user input into numbers and numbers into text for the UI.

const LOCALE = 'en-GB'

export type AmountInput =
  | { kind: 'empty' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: number }

// Input validation needs a maximum (OWASP Input Validation Cheat Sheet). It
// is far above any real conversion.
const MAX_CZK = 1_000_000_000

const AMOUNT_HINT = 'Enter a number without thousands separators, e.g. 1250.50'

/**
 * Reads an amount typed by the user. Spaces are ignored ("1 250"), "." or ","
 * is the decimal separator, and half-typed values ("12.", ".5") are accepted
 * so no error flashes while typing. "1,000" is rejected instead of guessed at.
 */
export function parseCzkAmount(input: string): AmountInput {
  const text = input.replace(/\s/g, '')
  if (text === '' || text === '.' || text === ',') return { kind: 'empty' }
  if (!/^\d*[.,]?\d{0,2}$/.test(text)) {
    return { kind: 'invalid', message: AMOUNT_HINT }
  }

  const value = Number(text.replace(',', '.'))
  if (value > MAX_CZK) {
    return {
      kind: 'invalid',
      message: `Enter at most ${new Intl.NumberFormat(LOCALE).format(MAX_CZK)} CZK`,
    }
  }
  return { kind: 'valid', value }
}

/** "EUR 41.01", "JPY 7,255" – the code avoids ambiguous symbols like "$". */
export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(value)
}

const rateFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

/** CNB publishes rates with three decimals: "24.385". */
export function formatRate(rate: number): string {
  return rateFormat.format(rate)
}

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'long',
  timeZone: 'UTC',
})

/** "2026-11-12" -> "12 November 2026". */
export function formatFixingDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`))
}

const pragueDate = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'Europe/Prague',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Whether the fixing is from today in Prague. It is not on weekends, holidays
 * and before ~14:30 on working days, when CNB still serves the last fixing.
 */
export function isFixingFromToday(isoDate: string, now = new Date()): boolean {
  const parts = pragueDate.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}` === isoDate
}
