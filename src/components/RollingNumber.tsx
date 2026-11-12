import styled from 'styled-components'
import { VisuallyHidden } from './VisuallyHidden'

// Odometer effect: every digit is a column of 0–9 that slides to the new
// digit. Rows are 1.15em high, matching the line-height of the text around.
const ROW = '1.15em'

// One word ("EUR", "1,025.22") stays on one line; lines break between words.
const Word = styled.span`
  display: inline-flex;
  white-space: nowrap;
`

const Char = styled.span`
  display: inline-block;
  height: ${ROW};
  line-height: ${ROW};
`

const Digit = styled(Char)`
  overflow: hidden;
`

const Strip = styled.span<{ $digit: number }>`
  display: flex;
  flex-direction: column;
  transform: translateY(calc(${({ $digit }) => $digit} * -${ROW}));
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Shows `text` with rolling digits. Screen readers get the plain text once;
 * the animated columns are hidden from them.
 */
export function RollingNumber({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      <VisuallyHidden>{text}</VisuallyHidden>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={`${words.length - w}`}>
            {w > 0 && ' '}
            <Word>
              {[...word].map((char, i) => {
                // Keyed from the right, so the ones digit stays the ones
                // digit when the number grows and the column can roll.
                const key = `${word.length - i}-${/\d/.test(char) ? 'd' : char}`
                return /\d/.test(char) ? (
                  <Digit key={key}>
                    <Strip $digit={Number(char)}>
                      {DIGITS.map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </Strip>
                  </Digit>
                ) : (
                  <Char key={key}>{char}</Char>
                )
              })}
            </Word>
          </span>
        ))}
      </span>
    </>
  )
}
