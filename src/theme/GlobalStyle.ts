import { createGlobalStyle } from 'styled-components'
import { darkColors, theme } from './theme'

const darkVars = Object.entries(darkColors)
  .map(
    ([name, value]) =>
      `${theme.vars.colors[name as keyof typeof darkColors]}: ${value};`,
  )
  .join('\n')

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light dark;
  }

  @media (prefers-color-scheme: dark) {
    /* Doubled :root outranks the light values from theme.GlobalStyle in any order. */
    :root:root {
      ${darkVars}
    }
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: ${theme.font.body};
    font-size: 100%;
    line-height: 1.5;
    /* Same-width digits keep rates and amounts aligned. */
    font-variant-numeric: tabular-nums;
    color: ${theme.colors.text};
    background: ${theme.colors.bg};
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3 {
    font-family: ${theme.font.heading};
  }

  input,
  button,
  select {
    font: inherit;
  }

  a,
  button,
  select,
  label,
  [role='button'] {
    cursor: pointer;
  }

  :disabled {
    cursor: default;
  }
`
