// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RollingNumber } from './RollingNumber'

const D = '0123456789'

describe('RollingNumber', () => {
  it('gives screen readers the plain text and hides the digit columns', () => {
    const { container } = render(<RollingNumber text="EUR 1,025.22" />)

    expect(screen.getByText('EUR 1,025.22')).toBeInTheDocument()
    // Every digit becomes a hidden 0–9 column; other characters stay as is.
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      `EUR ${D},${D}${D}${D}.${D}${D}`,
    )
  })
})
