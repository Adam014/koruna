import styled from 'styled-components'
import { theme } from '../theme/theme'

/** A raised panel on the page background. */
export const Card = styled.div`
  display: grid;
  gap: 24px;
  padding: 24px;
  border: 1px solid ${theme.colors.line};
  border-radius: 16px;
  background: ${theme.colors.surface};

  @media (max-width: 559px) {
    padding: 16px;
  }
`
