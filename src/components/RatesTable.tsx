import styled, { css } from 'styled-components'
import { formatRate } from '../rates/format'
import type { Rate } from '../rates/parse'
import { theme } from '../theme/theme'
import { Card } from './Card'
import { Flag } from './Flag'
import { Muted } from './Muted'

const Section = styled.section`
  display: grid;
  gap: 16px;
`

const Intro = styled.div`
  display: grid;
  gap: 4px;
`

const Heading = styled.h2`
  font-size: 1.5rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
`

// The card has no padding of its own here: rows run edge to edge and each
// cell pads itself.
const TableCard = styled(Card)`
  padding: 8px 0;

  @media (max-width: 559px) {
    padding: 4px 0;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  tbody tr {
    border-top: 1px solid ${theme.colors.line};
  }
`

// $numeric: numbers line up on the right, digit under digit (tabular figures).
const cell = ({ $numeric }: { $numeric?: boolean }) => `
  padding: 12px 24px;
  text-align: ${$numeric ? 'right' : 'left'};
  white-space: ${$numeric ? 'nowrap' : 'normal'};

  @media (max-width: 559px) {
    padding: 12px;
  }
`

const Th = styled.th<{ $numeric?: boolean }>`
  ${cell}
  /* A header may wrap on a phone; the numbers below never do. */
  white-space: normal;
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${theme.colors.muted};
`

const Td = styled.td<{ $numeric?: boolean }>`
  ${cell}
`

// Reads "100 JPY = 13.783" under the "Rate (CZK)" header. The "=" is drawn by CSS at the cell's right
// edge, so it lines up down the column and screen readers, which get the
// column headers, skip it.
const equalsGap = css`
  position: relative;
  padding-right: 48px;

  @media (max-width: 559px) {
    padding-right: 36px;
  }
`

const AmountTh = styled(Th)`
  ${equalsGap}
`

const AmountTd = styled(Td)`
  ${equalsGap}

  &::after {
    content: '=';
    position: absolute;
    right: 16px;
    color: ${theme.colors.muted};

    @media (max-width: 559px) {
      right: 10px;
    }
  }
`

const Currency = styled.span`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Names = styled.span`
  display: grid;
`

const Code = styled.span`
  font-weight: 600;
`

/** The CNB list: CZK for `amount` units of each currency. */
export function RatesTable({ rates }: { rates: Rate[] }) {
  return (
    <Section aria-labelledby="rates-heading">
      <Intro>
        <Heading id="rates-heading">Exchange rates</Heading>
        <Muted>CZK for the given amount of each currency.</Muted>
      </Intro>
      <TableCard>
        <Table aria-labelledby="rates-heading">
          <thead>
            <tr>
              <Th scope="col">Currency</Th>
              <AmountTh scope="col" $numeric>
                Amount
              </AmountTh>
              <Th scope="col" $numeric>
                Rate (CZK)
              </Th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.code}>
                <Td>
                  <Currency>
                    <Flag currency={rate.code} />
                    <Names>
                      <Code>{rate.code}</Code>
                      <Muted>
                        {rate.country} {rate.currency}
                      </Muted>
                    </Names>
                  </Currency>
                </Td>
                <AmountTd $numeric>
                  {rate.amount} <Muted>{rate.code}</Muted>
                </AmountTd>
                <Td $numeric>{formatRate(rate.rate)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </Section>
  )
}
