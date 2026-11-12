// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import daily from '../rates/__fixtures__/daily-2026-11-12.txt?raw'
import { parseDailyRates } from '../rates/parse'
import { RatesTable } from './RatesTable'

const { rates } = parseDailyRates(daily)

describe('RatesTable', () => {
  it('lists every CNB rate with its amount', () => {
    render(<RatesTable rates={rates} />)
    const table = screen.getByRole('table', { name: 'Exchange rates' })

    // Header row + one row per currency.
    expect(within(table).getAllByRole('row')).toHaveLength(rates.length + 1)

    // JPY is quoted per 100 units: the amount must be shown with the rate.
    const jpy = within(table).getByRole('row', { name: /JPY/ })
    expect(
      within(jpy)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['JPYJapan yen', '100 JPY', '13.783'])
  })
})
