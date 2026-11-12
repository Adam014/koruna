export type AmountInput =
  | { kind: 'empty' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: number }

/**
 * Reads an amount typed by the user. Spaces are ignored ("1 250"), and either
 * "." or "," works as the decimal separator ("1250.5", "1250,5"). At most two
 * decimals are allowed, so "1,000" is rejected instead of silently read as 1.
 */
export function parseCzkAmount(input: string): AmountInput {
  const text = input.replace(/\s/g, '')
  if (text === '') return { kind: 'empty' }

  if (!/^\d+([.,]\d+)?$/.test(text)) {
    return { kind: 'invalid', message: 'Enter a number, e.g. 1250 or 1250.50' }
  }
  if (/[.,]\d{3,}$/.test(text)) {
    return { kind: 'invalid', message: 'Use at most 2 decimal places' }
  }

  return { kind: 'valid', value: Number(text.replace(',', '.')) }
}
