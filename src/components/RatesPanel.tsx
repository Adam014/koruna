import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import styled from 'styled-components'
import { ratesQuery } from '../rates/api'
import { formatFixingDate, isFixingFromToday } from '../rates/format'
import type { DailyRates } from '../rates/parse'
import { theme } from '../theme/theme'
import { Card } from './Card'
import { Converter } from './Converter'
import { Muted } from './Muted'

const Section = styled.section`
  display: grid;
  gap: 24px;
`

const Intro = styled.div`
  display: grid;
  gap: 8px;
`

const Heading = styled.h2`
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
`

const RetryButton = styled.button`
  justify-self: start;
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  color: ${theme.colors.text};
  background: ${theme.colors.bg};
`

/** The converter section: loads the CNB rates, then shows the converter. */
export function RatesPanel() {
  const query = useQuery(ratesQuery)
  const { data } = query

  return (
    <Section aria-labelledby="convert-heading">
      <Intro>
        <Heading id="convert-heading">Convert Czech koruna</Heading>
        {data && (
          <Muted>
            CNB rates of {formatFixingDate(data.date)}.
            {!isFixingFromToday(data.date) &&
              ' The latest available; CNB publishes new rates on working days around 14:30.'}
          </Muted>
        )}
      </Intro>
      <RatesBody query={query} />
    </Section>
  )
}

// Takes the query result whole: spreading it would read every field and
// defeat TanStack Query's tracked properties (fewer re-renders).
// https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations
function RatesBody({ query }: { query: UseQueryResult<DailyRates> }) {
  const { data, isError, isFetching, refetch } = query
  // Data first: a failed background refetch keeps the last rates, so the
  // converter (and what the user typed) stays.
  // https://tkdodo.eu/blog/status-checks-in-react-query
  if (data) return <Converter rates={data.rates} />

  if (isError) {
    return (
      <Card>
        <p role="alert">Could not load the exchange rates.</p>
        <RetryButton
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? 'Trying again…' : 'Try again'}
        </RetryButton>
      </Card>
    )
  }

  return (
    <Card>
      <Muted role="status">Loading exchange rates…</Muted>
    </Card>
  )
}
