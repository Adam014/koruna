export interface QuotedRate {
  /** Units of the foreign currency the rate is quoted for (CNB "Amount"). */
  amount: number
  /** CZK for `amount` units of the foreign currency. */
  rate: number
}

/** Converts a CZK amount into the foreign currency. */
export function convertFromCzk(czk: number, quote: QuotedRate): number {
  return czk / quote.rate
}
