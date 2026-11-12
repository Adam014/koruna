// Turning user input into numbers and numbers into text for the UI.

const LOCALE = 'en-GB'

export type AmountInput =
  | { kind: 'empty' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: number }

// Input validation needs a maximum (OWASP Input Validation Cheat Sheet). It
// is far above any real conversion.
const MAX_CZK = 1_000_000_000

// Digit groups in the amount field are separated by a no-break space, the SI
// style. Unlike "," it cannot be mistaken for a decimal separator, so both
// "1 250.50" and "1 250,50" stay unambiguous.
// https://www.bipm.org/en/publications/si-brochure (section 5.4.4)
const GROUP = '\u00a0'

const AMOUNT_HINT = 'Enter digits with up to 2 decimal places, e.g. 1 250.50'

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
      message: `Enter at most ${formatAmountInput(String(MAX_CZK))} CZK`,
    }
  }
  return { kind: 'valid', value }
}

/**
 * Formats a typed amount like the results: "1000000,5" becomes "1 000 000.5".
 * A typed "," is shown as "." (a Czech keyboard types ","), so the field and
 * the result use one decimal separator. Anything that is not a plain number
 * is left as typed, so the user sees what the error message is about.
 */
export function formatAmountInput(input: string): string {
  const match = /^(\d*)([.,]\d*)?$/.exec(input.replace(/\s/g, ''))
  if (!match) return input
  const [, whole = '', fraction = ''] = match
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP) + fraction.replace(',', '.')
  )
}

/**
 * Applies one edit of the amount field: formats the new text and works out
 * where the caret goes, so it stays after the same digit when group spaces
 * appear or disappear. Deleting a group space on its own would be undone by
 * the formatting, so the digit beside it is deleted instead, as number fields
 * in banking apps do.
 */
export function editAmountInput(
  previous: string,
  edited: string,
  caret: number,
  inputType: string,
): { text: string; caret: number } {
  let text = edited
  let at = caret
  const onlyGroupSpaceRemoved =
    text.length < previous.length &&
    text.replace(/\s/g, '') === previous.replace(/\s/g, '')
  if (
    onlyGroupSpaceRemoved &&
    inputType === 'deleteContentBackward' &&
    at > 0
  ) {
    text = text.slice(0, at - 1) + text.slice(at)
    at -= 1
  } else if (onlyGroupSpaceRemoved && inputType === 'deleteContentForward') {
    text = text.slice(0, at) + text.slice(at + 1)
  }

  const formatted = formatAmountInput(text)
  const before = text.slice(0, at).replace(/\s/g, '').length
  return { text: formatted, caret: caretAfter(formatted, before) }
}

// Index in `text` right after its `count`-th non-space character.
function caretAfter(text: string, count: number): number {
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (seen === count) return i
    if (!/\s/.test(text.charAt(i))) seen++
  }
  return text.length
}

// Intl gives the English digits and decimal point; its thousands separator
// (",") is swapped for the SI group space used in the amount field, so input
// and results read the same. The space after the currency code becomes a
// normal one: a long result may wrap there, never inside the number.
function withGroupSpaces(format: Intl.NumberFormat, value: number): string {
  return format
    .formatToParts(value)
    .map((part) => {
      if (part.type === 'group') return GROUP
      if (part.type === 'literal') return ' '
      return part.value
    })
    .join('')
}

/** "EUR 41.01", "JPY 7 255" – the code avoids ambiguous symbols like "$". */
export function formatMoney(value: number, currency: string): string {
  const format = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  })
  return withGroupSpaces(format, value)
}

const rateFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

/** CNB publishes rates with three decimals: "24.385". */
export function formatRate(rate: number): string {
  return withGroupSpaces(rateFormat, rate)
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
