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
import { Flag } from './Flag'
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

// Whether the browser knows <selectedcontent> (customizable select). Where
// it does not (Firefox, older Safari, jsdom in tests), the element would be
// unknown and React warns about it, so it is not rendered there.
const customizableSelect = 'HTMLSelectedContentElement' in globalThis

// Customizable select where supported: the options and the closed select
// show the flag. Other browsers keep the native select, with the flag of the
// chosen currency drawn beside its text (Lead).
// https://developer.chrome.com/blog/a-customizable-select
const Select = styled.select`
  ${control}
  padding-left: 52px;
  padding-right: 44px;
  appearance: none;
  text-overflow: ellipsis;

  @supports (appearance: base-select) {
    &,
    &::picker(select) {
      appearance: base-select;
    }

    padding-left: 16px;

    &::picker-icon {
      display: none;
    }

    selectedcontent,
    option {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* The closed select keeps one line; a long name ends in "…". */
    selectedcontent {
      min-width: 0;
    }

    selectedcontent > span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &::picker(select) {
      max-height: min(360px, 60vh);
      margin-top: 4px;
      padding: 6px;
      border: 1px solid ${theme.colors.line};
      border-radius: 12px;
      color: ${theme.colors.text};
      background: ${theme.colors.surface};
      box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
    }

    option {
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
    }

    option::checkmark {
      display: none;
    }

    /* Gold tints: light for the option under the pointer or keyboard focus,
       stronger for the chosen one. Text keeps the body colour (contrast). */
    option:hover,
    option:focus-visible {
      background: color-mix(in srgb, ${theme.colors.accent} 14%, transparent);
    }

    option:checked {
      font-weight: 600;
      background: color-mix(in srgb, ${theme.colors.accent} 30%, transparent);
    }
  }
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

// The selected currency's flag, drawn over the left edge of the select.
const Lead = styled.span`
  grid-area: 1 / 1;
  justify-self: start;
  display: flex;
  margin-left: 16px;
  pointer-events: none;

  @supports (appearance: base-select) {
    display: none;
  }
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
  const [code, setCode] = useState(
    () => rates.find((r) => r.code === 'EUR')?.code ?? rates[0].code,
  )
  const amountRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    const field = amountRef.current
    if (field && amount.caret !== null && document.activeElement === field) {
      field.setSelectionRange(amount.caret, amount.caret)
    }
  }, [amount])

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
              {/* Shows the chosen option, flag included. Only where the
                  browser knows <selectedcontent>; elsewhere React would warn
                  about an unknown element. */}
              {customizableSelect && (
                <button type="button">
                  <selectedcontent />
                </button>
              )}
              {rates.map((r) => (
                <option key={r.code} value={r.code}>
                  <Flag currency={r.code} />
                  <span>
                    {r.code} – {r.country} {r.currency}
                  </span>
                </option>
              ))}
            </Select>
            <Lead>
              <Flag currency={rate.code} />
            </Lead>
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
