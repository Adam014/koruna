import { createTheme } from 'styled-components'

// All design tokens live here. createTheme turns every leaf into a CSS custom
// property, so components use `theme.colors.x` (a var()) and a colour scheme
// change only swaps variables: nothing re-renders.
const tokens = {
  colors: {
    bg: '#fbfaf7',
    surface: '#ffffff',
    text: '#1c1917',
    muted: '#57534e',
    accent: '#c8901a',
    // Darker gold for text on light backgrounds (contrast).
    accentText: '#8a5d0b',
    // Colour scheme switch: off-state track and knob (3:1 contrast, WCAG 1.4.11).
    track: '#8f8984',
    knob: '#ffffff',
  },
  font: {
    body: "'Geist Variable', system-ui, sans-serif",
    heading: "'Bricolage Grotesque Variable', system-ui, sans-serif",
  },
}

export type Tokens = typeof tokens

// Dark mode values, applied by GlobalStyle. Typed so a new colour token
// without a dark value fails typecheck.
export const darkColors: Tokens['colors'] = {
  bg: '#141210',
  surface: '#1e1b18',
  text: '#f5f5f4',
  muted: '#a8a29e',
  accent: '#f2b93b',
  accentText: '#f2b93b',
  track: '#78716c',
  knob: '#ffffff',
}

export const theme = createTheme(tokens)
