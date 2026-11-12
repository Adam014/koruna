// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import daily from '../rates/__fixtures__/daily-2026-11-12.txt?raw'
import { parseDailyRates } from '../rates/parse'
import { Converter } from './Converter'

const { rates } = parseDailyRates(daily)

const amount = () => screen.getByLabelText('Amount in CZK')
const currency = () => screen.getByLabelText('Currency')
const result = () => screen.getByRole('status')

describe('Converter', () => {
  it('starts with EUR and converts as the user types', async () => {
    render(<Converter rates={rates} />)
    expect(currency()).toHaveValue('EUR')

    await userEvent.type(amount(), '1000')

    // 1000 / 24.385
    expect(result()).toHaveTextContent('EUR 41.01')
    expect(result()).toHaveTextContent('1 EUR = 24.385 CZK')
  })

  it('uses the CNB amount for currencies quoted per 100 units', async () => {
    render(<Converter rates={rates} />)
    await userEvent.type(amount(), '1 000,50')
    await userEvent.selectOptions(currency(), 'JPY')

    // 1000.50 * 100 / 13.783
    expect(screen.getByText('JPY 7 259')).toBeInTheDocument()
    expect(result()).toHaveTextContent('100 JPY = 13.783 CZK')
  })

  it('groups the digits while typing and keeps editing natural', async () => {
    render(<Converter rates={rates} />)
    await userEvent.type(amount(), '1000000')
    expect(amount()).toHaveValue('1\u00a0000\u00a0000')

    // Backspace at the end removes a digit and regroups.
    await userEvent.type(amount(), '{Backspace}')
    expect(amount()).toHaveValue('100\u00a0000')
  })

  it('explains an invalid amount and shows no result', async () => {
    render(<Converter rates={rates} />)
    await userEvent.type(amount(), '1,000.50')

    expect(amount()).toBeInvalid()
    expect(amount()).toHaveAccessibleDescription(
      'Enter digits with up to 2 decimal places, e.g. 1 250.50',
    )
    expect(screen.queryByText(/^EUR \d/)).not.toBeInTheDocument()
  })
})
