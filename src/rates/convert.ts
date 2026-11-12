import type { Rate } from './parse'

/**
 * Converts an amount in CZK into the given currency.
 *
 * CNB quotes `rate` CZK for `amount` units (e.g. 13.783 CZK per 100 JPY),
 * so one unit costs `rate / amount` CZK.
 */
export function convertFromCzk(
  czk: number,
  { amount, rate }: Pick<Rate, 'amount' | 'rate'>,
): number {
  return (czk * amount) / rate
}
