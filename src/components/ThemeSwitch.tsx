import { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import {
  chosenScheme,
  onSystemSchemeChange,
  saveScheme,
  systemScheme,
} from '../theme/colorScheme'
import { theme } from '../theme/theme'
import { MoonIcon, SunIcon } from './icons'

const Control = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

// Sun and moon beside the switch say what each side means; the active one
// is gold.
const iconStyle = css`
  flex-shrink: 0;
  color: ${theme.colors.muted};
  transition: color 0.2s ease;

  &[data-active='true'] {
    color: ${theme.colors.accentText};
  }
`
const Sun = styled(SunIcon)`
  ${iconStyle}
`
const Moon = styled(MoonIcon)`
  ${iconStyle}
`

// iOS-style switch: 51 × 31 track, 27 px knob.
const Track = styled.button`
  position: relative;
  flex-shrink: 0;
  width: 51px;
  height: 31px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${theme.colors.track};
  transition: background-color 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 27px;
    height: 27px;
    border-radius: 50%;
    background: ${theme.colors.knob};
    box-shadow:
      0 3px 8px rgb(0 0 0 / 15%),
      0 3px 1px rgb(0 0 0 / 6%);
    transition: transform 0.2s ease;
  }

  &[aria-checked='true'] {
    background: ${theme.colors.accent};
  }

  &[aria-checked='true']::after {
    transform: translateX(20px);
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.accent};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    &::after {
      transition: none;
    }
  }
`

export function ThemeSwitch() {
  const [scheme, setScheme] = useState(() => chosenScheme() ?? systemScheme())

  // Until the user picks one, keep the switch in step with the system.
  useEffect(
    () =>
      onSystemSchemeChange((next) => {
        if (!chosenScheme()) setScheme(next)
      }),
    [],
  )

  const dark = scheme === 'dark'

  return (
    <Control>
      <Sun data-active={!dark} />
      <Track
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Dark mode"
        onClick={() => {
          const next = dark ? 'light' : 'dark'
          saveScheme(next)
          setScheme(next)
        }}
      />
      <Moon data-active={dark} />
    </Control>
  )
}
