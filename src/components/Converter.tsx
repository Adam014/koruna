import { useId, useLayoutEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { convertFromCzk } from '../rates/convert'
import {
  editAmountInput,
  formatMoney,
  formatRate,
  parseCzkAmount,
} from '../rates/format'
import type { DailyRates } from '../rates/parse'
import { theme } from '../theme/theme'
import { Card } from './Card'
import { ChevronDownIcon } from './icons'
import { Muted } from './Muted'
import { RollingNumber } from './RollingNumber'

const Fields = styled.div`
  display: grid;
  gap: 16px;

  @media (min-width: 560px) {
    grid-template-columns: 3fr 2fr;
  }
`

const Field = styled.div`
  display: grid;
  gap: 8px;
  align-content: start;
`

const Label = styled.label`
  font-size: 0.9375rem;
  font-weight: 600;
`

// Holds a control and a decoration drawn over its right edge.
const Box = styled.div`
  position: relative;
  display: grid;
  align-items: center;
`

const control = css`
  grid-area: 1 / 1;
  width: 100%;
  min-height: 56px;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  color: ${theme.colors.text};
  background: ${theme.colors.bg};
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${theme.colors.muted};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const Input = styled.input`
  ${control}
  padding-right: 64px;
  font-size: 1.25rem;
  font-weight: 500;

  &[aria-invalid='true'] {
    border-color: ${theme.colors.danger};
  }
`

const Select = styled.select`
  ${control}
  padding-right: 44px;
  appearance: none;
  text-overflow: ellipsis;
`

const decoration = css`
  grid-area: 1 / 1;
  justify-self: end;
  margin-right: 16px;
  color: ${theme.colors.muted};
  pointer-events: none;
`

const Suffix = styled.span`
  ${decoration}
  font-weight: 600;
`

const Chevron = styled(ChevronDownIcon)`
  ${decoration}
  margin-right: 14px;
`

const ErrorText = styled.p`
  color: ${theme.colors.danger};
`

const Result = styled.output`
  display: grid;
  gap: 4px;
  padding-top: 24px;
  border-top: 1px solid ${theme.colors.line};
`

const Value = styled.span<{ $empty?: boolean }>`
  color: ${({ $empty }) => ($empty ? theme.colors.muted : 'inherit')};
  font-size: clamp(1.5rem, 7vw, 2.75rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
`

// Converts in real time: there is no submit step, the result follows the
// input. <output> is a live region (role status), so screen readers hear it.
export function Converter({ rates }: Pick<DailyRates, 'rates'>) {
  const id = useId()
  // The caret lives in state with the text: every edit is a new object, so
  // the effect also runs when formatting gives back the same text (a typed
  // space) and React has reset the caret to the end.
  const [amount, setAmount] = useState<{ text: string; caret: number | null }>({
    text: '',
    caret: null,
  })
  const amountRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    const field = amountRef.current
    if (field && amount.caret !== null && document.activeElement === field) {
      field.setSelectionRange(amount.caret, amount.caret)
    }
  }, [amount])
  const [code, setCode] = useState(
    () => rates.find((r) => r.code === 'EUR')?.code ?? rates[0].code,
  )

  // A refetch could drop the chosen currency; fall back instead of crashing.
  const rate = rates.find((r) => r.code === code) ?? rates[0]
  const input = parseCzkAmount(amount.text)

  return (
    <Card as="form" onSubmit={(event) => event.preventDefault()}>
      <Fields>
        <Field>
          <Label htmlFor={`${id}-amount`}>Amount in CZK</Label>
          <Box>
            <Input
              id={`${id}-amount`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount.text}
              ref={amountRef}
              onChange={(event) => {
                const { value, selectionStart } = event.target
                const { nativeEvent } = event
                const edit = editAmountInput(
                  amount.text,
                  value,
                  selectionStart ?? value.length,
                  nativeEvent instanceof InputEvent
                    ? nativeEvent.inputType
                    : '',
                )
                setAmount(edit)
              }}
              aria-invalid={input.kind === 'invalid'}
              aria-describedby={
                input.kind === 'invalid' ? `${id}-error` : undefined
              }
            />
            <Suffix aria-hidden="true">CZK</Suffix>
          </Box>
          {input.kind === 'invalid' && (
            <ErrorText id={`${id}-error`} role="alert">
              {input.message}
            </ErrorText>
          )}
        </Field>
        <Field>
          <Label htmlFor={`${id}-currency`}>Currency</Label>
          <Box>
            <Select
              id={`${id}-currency`}
              value={rate.code}
              onChange={(event) => setCode(event.target.value)}
            >
              {rates.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code} – {r.country} {r.currency}
                </option>
              ))}
            </Select>
            <Chevron />
          </Box>
        </Field>
      </Fields>
      <Result htmlFor={`${id}-amount ${id}-currency`}>
        <Muted>You get</Muted>
        {input.kind === 'invalid' ? (
          // Keeps the layout steady; hidden so it is not read as "minus".
          <Value $empty aria-hidden="true">
            –
          </Value>
        ) : (
          // One element for empty and valid, so the first digits typed roll
          // up from 0.00 instead of popping in.
          <Value $empty={input.kind === 'empty'}>
            <RollingNumber
              text={formatMoney(
                input.kind === 'valid' ? convertFromCzk(input.value, rate) : 0,
                rate.code,
              )}
            />
          </Value>
        )}
        <Muted>
          {rate.amount} {rate.code} = {formatRate(rate.rate)} CZK
        </Muted>
      </Result>
    </Card>
  )
}
