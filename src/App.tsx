import styled from 'styled-components'
import { Logo } from './components/Logo'
import { ThemeSwitch } from './components/ThemeSwitch'
import { theme } from './theme/theme'

const Main = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Title = styled.h1`
  margin: 0;
  color: ${theme.colors.accentText};
`

export default function App() {
  return (
    <Main>
      <Header>
        <Brand>
          <Logo />
          <Title>Koruna</Title>
        </Brand>
        <ThemeSwitch />
      </Header>
    </Main>
  )
}
