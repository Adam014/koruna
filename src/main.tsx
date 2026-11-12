import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/geist'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import App from './App.tsx'
import { GlobalStyle } from './theme/GlobalStyle'
import { theme } from './theme/theme'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

const queryClient = new QueryClient()

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme.raw}>
        <theme.GlobalStyle />
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
