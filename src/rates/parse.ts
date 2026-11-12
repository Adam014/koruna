// Parser for the CNB daily exchange rate file (daily.txt).
// Format: https://www.cnb.cz/en/faq/Format-of-the-foreign-exchange-market-rates/
//
//   12 Nov 2026 #218
//   Country|Currency|Amount|Code|Rate
//   Australia|dollar|1|AUD|15.011
//   ...

export interface Rate {
  country: string
  currency: string
  /** Number of currency units the rate is quoted for (1, 100 or 1000). */
  amount: number
  /** ISO 4217 code, e.g. "EUR". */
  code: string
  /** CZK for `amount` units of the currency. */
  rate: number
}

export interface DailyRates {
  /** Fixing date as an ISO date ("2026-11-12"). Weekends repeat the last fixing. */
  date: string
  /** Sequence number of the fixing in the year. */
  sequence: number
  /** Never empty: the parser rejects a file without rates. */
  rates: [Rate, ...Rate[]]
}

const COLUMNS = 'Country|Currency|Amount|Code|Rate'

// The CNB docs describe the date as DD.MM.YYYY, but the English file really
// starts with "12 Nov 2026 #218". We parse what the source actually returns.
const HEADER_PATTERN = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}) #(\d+)$/

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export class RatesParseError extends Error {
  override name = 'RatesParseError'
}

export function parseDailyRates(text: string): DailyRates {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')

  const [header, columns, ...rows] = lines
  if (header === undefined) throw new RatesParseError('The rates file is empty')
  if (columns !== COLUMNS) {
    throw new RatesParseError(`Unexpected column header: "${columns ?? ''}"`)
  }

  const { date, sequence } = parseHeader(header)
  const [first, ...rest] = rows.map(parseRow)
  if (!first) throw new RatesParseError('The rates file has no rates')

  return { date, sequence, rates: [first, ...rest] }
}

function parseHeader(line: string): Pick<DailyRates, 'date' | 'sequence'> {
  const [, day = '', monthName = '', year = '', sequence = ''] =
    HEADER_PATTERN.exec(line) ?? []
  const month = MONTHS.indexOf(monthName) + 1 // 0 when there is no match
  if (month === 0) throw new RatesParseError(`Unexpected date line: "${line}"`)

  // Date.UTC rolls impossible dates over (31 Nov -> 1 Dec, 0 Nov -> 31 Oct);
  // a changed day or month means the date does not exist.
  const check = new Date(Date.UTC(Number(year), month - 1, Number(day)))
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== Number(day)) {
    throw new RatesParseError(`Invalid date: "${line}"`)
  }
  return {
    date: `${year}-${pad(month)}-${pad(day)}`,
    sequence: Number(sequence),
  }
}

function pad(value: number | string): string {
  return String(value).padStart(2, '0')
}

function parseRow(line: string): Rate {
  const fields = line.split('|')
  if (fields.length !== 5) {
    throw new RatesParseError(`Expected 5 columns: "${line}"`)
  }
  const [
    country = '',
    currency = '',
    amountText = '',
    code = '',
    rateText = '',
  ] = fields

  // Strict patterns: Number() alone would also accept "", "1e3" or "0x10".
  if (!/^[1-9]\d*$/.test(amountText)) {
    throw new RatesParseError(`Invalid amount: "${line}"`)
  }
  if (!/^\d+(\.\d+)?$/.test(rateText) || Number(rateText) === 0) {
    throw new RatesParseError(`Invalid rate: "${line}"`)
  }
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new RatesParseError(`Invalid currency code: "${line}"`)
  }

  return {
    country,
    currency,
    amount: Number(amountText),
    code,
    rate: Number(rateText),
  }
}
