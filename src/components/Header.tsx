import styled from 'styled-components'
import { theme } from '../theme/theme'
import { Logo } from './Logo'
import { ThemeSwitch } from './ThemeSwitch'

const Bar = styled.header`
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
  font-size: 1.5rem;
  letter-spacing: -0.01em;
  color: ${theme.colors.accentText};
`

export function Header() {
  return (
    <Bar>
      <Brand>
        <Logo />
        <Title>Koruna</Title>
      </Brand>
      <ThemeSwitch />
    </Bar>
  )
}
