// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Flag } from './Flag'

describe('Flag', () => {
  it.each([
    ['EUR', 'eu'],
    ['CZK', 'cz'],
    ['JPY', 'jp'],
  ])('shows the %s flag from the ISO 3166 prefix', (currency, country) => {
    const { container } = render(<Flag currency={currency} />)
    const image = container.querySelector('img')
    expect(image?.getAttribute('src')).toContain(`${country}.svg`)
    // Decorative: the country is already named in text.
    expect(image).toHaveAttribute('alt', '')
  })

  it('shows no flag for a currency of no country (XDR, IMF)', () => {
    const { container } = render(<Flag currency="XDR" />)
    expect(container.querySelector('img')).toBeNull()
  })
})
