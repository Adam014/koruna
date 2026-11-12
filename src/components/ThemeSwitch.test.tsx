// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeSwitch } from './ThemeSwitch'

// jsdom has no matchMedia; this stands in for the OS colour scheme.
let systemDark = false
let notifySystemChange: ((event: { matches: boolean }) => void) | undefined

beforeEach(() => {
  systemDark = false
  localStorage.clear()
  delete document.documentElement.dataset.theme
  vi.stubGlobal('matchMedia', () => ({
    matches: systemDark,
    addEventListener: (_: string, listener: typeof notifySystemChange) => {
      notifySystemChange = listener
    },
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const darkSwitch = () => screen.getByRole('switch', { name: 'Dark mode' })

describe('ThemeSwitch', () => {
  it('starts from the system scheme', () => {
    systemDark = true
    render(<ThemeSwitch />)
    expect(darkSwitch()).toBeChecked()
  })

  it('switches to dark, applies it to the page and remembers it', async () => {
    render(<ThemeSwitch />)
    expect(darkSwitch()).not.toBeChecked()

    await userEvent.click(darkSwitch())

    expect(darkSwitch()).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('koruna-color-scheme')).toBe('dark')
  })

  it('prefers the saved choice over the system', () => {
    systemDark = true
    // What the inline script in index.html does with a saved choice.
    document.documentElement.dataset.theme = 'light'
    render(<ThemeSwitch />)
    expect(darkSwitch()).not.toBeChecked()
  })

  it('follows a system change until the user picks a scheme', async () => {
    render(<ThemeSwitch />)
    act(() => notifySystemChange?.({ matches: true }))
    expect(darkSwitch()).toBeChecked()

    await userEvent.click(darkSwitch())
    act(() => notifySystemChange?.({ matches: true }))
    expect(darkSwitch()).not.toBeChecked()
  })

  it('keeps the switch and the page in step when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<ThemeSwitch />)

    await userEvent.click(darkSwitch())
    act(() => notifySystemChange?.({ matches: false }))

    expect(darkSwitch()).toBeChecked()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
