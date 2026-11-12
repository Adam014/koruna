import styled from 'styled-components'
import { theme } from './theme/theme'

const Main = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px;
`

const Title = styled.h1`
  margin: 0;
  color: ${theme.colors.accentText};
`

export default function App() {
  return (
    <Main>
      <Title>Koruna</Title>
    </Main>
  )
}
