import styled from 'styled-components'
import { theme } from '../theme/theme'

// Flag SVGs from flag-icons (MIT). Each becomes its own file in the build,
// so the browser fetches only the flags on screen; ?no-inline stops Vite
// from inlining the small ones into the JavaScript bundle.
// https://vite.dev/guide/features#glob-import
const FLAGS_DIR = '/node_modules/flag-icons/flags/4x3/'
const flags = import.meta.glob<string>(
  '/node_modules/flag-icons/flags/4x3/*.svg',
  { eager: true, query: '?no-inline', import: 'default' },
)

// ISO 4217: a national currency code starts with its country's ISO 3166-1
// code (CZK → CZ, EUR → EU). X codes such as XDR belong to no country.
function flagUrl(currency: string): string | undefined {
  return flags[`${FLAGS_DIR}${currency.slice(0, 2).toLowerCase()}.svg`]
}

const Image = styled.img`
  flex-shrink: 0;
  width: 24px;
  height: 18px;
  border-radius: 3px;
  object-fit: cover;
  /* Keeps white flag edges visible on a white card. */
  box-shadow: 0 0 0 1px ${theme.colors.line};
`

// Same footprint as a flag, so names stay aligned when there is none.
const Blank = styled.span`
  flex-shrink: 0;
  width: 24px;
`

/** The flag of the currency's country; decorative, the name is in text. */
export function Flag({ currency }: { currency: string }) {
  const src = flagUrl(currency)
  if (!src) return <Blank aria-hidden="true" />
  return <Image src={src} alt="" width={24} height={18} loading="lazy" />
}
