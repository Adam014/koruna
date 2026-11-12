import { theme } from '../theme/theme'

/** The koruna crown from the favicon, drawn in the theme's gold. */
export function Logo() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill={theme.colors.accent}
      aria-hidden="true"
    >
      <path d="M4.6 9.2a1 1 0 0 1 1.6-.8l5.1 4.1 3.9-6.3a1 1 0 0 1 1.7 0l3.9 6.3 5.1-4.1a1 1 0 0 1 1.6.8L26 22H6L4.6 9.2Z" />
      <rect x="6" y="24" width="20" height="3" rx="1.5" />
    </svg>
  )
}
