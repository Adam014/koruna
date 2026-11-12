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
    // Boundaries of controls (inputs, the switch track): 3:1 against bg and
    // surface, WCAG 1.4.11.
    border: '#8f8984',
    // Knob of the colour scheme switch.
    knob: '#ffffff',
    // Decorative dividers and card edges; not a control boundary.
    line: '#e7e5e4',
    danger: '#b42318',
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
  border: '#78716c',
  knob: '#ffffff',
  line: '#2e2a26',
  danger: '#f97066',
}

export const theme = createTheme(tokens)
