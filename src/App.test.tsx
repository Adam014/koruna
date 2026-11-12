// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import daily from './rates/__fixtures__/daily-2026-11-12.txt?raw'

function renderApp() {
  // A fresh client per test; retries run at once instead of after a backoff.
  const client = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 } },
  })
  render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  )
  return client
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('loads the rates, shows the fixing date and converts', async () => {
    vi.stubGlobal('fetch', async () => new Response(daily))
    renderApp()

    expect(screen.getByText('Loading exchange rates…')).toBeInTheDocument()
    expect(
      await screen.findByText(/CNB rates of 12 November 2026/),
    ).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Amount in CZK'), '1000')
    expect(screen.getByRole('status')).toHaveTextContent('EUR 41.01')
  })

  it('keeps the converter when a background refetch fails', async () => {
    const fetchMock = vi.fn(async () => new Response(daily))
    vi.stubGlobal('fetch', fetchMock)
    const client = renderApp()
    await userEvent.type(await screen.findByLabelText('Amount in CZK'), '1000')

    fetchMock.mockImplementation(
      async () => new Response('CNB is unreachable', { status: 502 }),
    )
    await client.refetchQueries({ queryKey: ['rates'] })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Amount in CZK')).toHaveValue('1\u00a0000')
    expect(screen.getByRole('status')).toHaveTextContent('EUR 41.01')
  })

  it('reports a failed load and recovers on retry', async () => {
    const fetchMock = vi.fn(
      async () => new Response('CNB is unreachable', { status: 502 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    renderApp()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load the exchange rates.',
    )

    fetchMock.mockImplementation(async () => new Response(daily))
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByText(/CNB rates of 12 November 2026/),
    ).toBeInTheDocument()
  })
})
