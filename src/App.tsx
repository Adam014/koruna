import styled from 'styled-components'
import { Header } from './components/Header'
import { RatesPanel } from './components/RatesPanel'

// minmax(0, 1fr): the column is as wide as the screen, never as wide as its
// widest content, so nothing pushes the page sideways on a narrow phone.
// https://developer.mozilla.org/en-US/docs/Web/CSS/minmax
const Page = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px;

  /* Folded phones' cover screens and other very narrow ones. */
  @media (max-width: 359px) {
    padding: 24px 12px;
  }
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
