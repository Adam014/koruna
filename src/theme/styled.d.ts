import 'styled-components'
import type { Tokens } from './theme'

declare module 'styled-components' {
  export interface DefaultTheme extends Tokens {}
}
