import { queryOptions } from '@tanstack/react-query'
import { parseDailyRates, type DailyRates } from './parse'

/** Loads the CNB rates through the same-origin Worker (cnb.cz has no CORS). */
export async function fetchRates(signal?: AbortSignal): Promise<DailyRates> {
  const response = await fetch('/api/rates', { signal })
  // fetch only rejects on network errors; a 4xx/5xx must fail the query too.
  if (!response.ok) throw new Error(`Rates request failed (${response.status})`)
  return parseDailyRates(await response.text())
}

// CNB fixes rates once per working day (~14:30 Prague time), so the defaults
// (stale at once, three retries) do not fit. After 30 minutes a refocused tab
// refetches, which picks up a new fixing soon after it is published.
// https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
export const ratesQuery = queryOptions({
  queryKey: ['rates'],
  queryFn: ({ signal }) => fetchRates(signal),
  staleTime: 30 * 60 * 1000,
  retry: 1,
})
