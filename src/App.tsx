import styled from 'styled-components'
import { Header } from './components/Header'
import { RatesPanel } from './components/RatesPanel'

const Page = styled.div`
  display: grid;
  gap: 32px;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px;
`

export default function App() {
  return (
    <Page>
      <Header />
      <main>
        <RatesPanel />
      </main>
    </Page>
  )
}
