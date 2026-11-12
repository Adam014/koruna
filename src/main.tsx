import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/geist'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import App from './App.tsx'
import { GlobalStyle } from './theme/GlobalStyle'
import { theme } from './theme/theme'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme.raw}>
      <theme.GlobalStyle />
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
