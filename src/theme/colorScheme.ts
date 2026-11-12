export type ColorScheme = 'light' | 'dark'

// Also read by the inline script in index.html, which applies the choice
// before the first paint so the page does not flash the other scheme.
const STORAGE_KEY = 'koruna-color-scheme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function isScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark'
}

/**
 * The user's explicit choice, or null when the page follows the system.
 * Read from the page, not storage: the inline script and saveScheme set it
 * there even when storage is blocked, and the CSS reads it from there too.
 */
export function chosenScheme(): ColorScheme | null {
  const value = document.documentElement.dataset.theme
  return isScheme(value) ? value : null
}

export function systemScheme(): ColorScheme {
  return matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function saveScheme(scheme: ColorScheme): void {
  document.documentElement.dataset.theme = scheme
  try {
    localStorage.setItem(STORAGE_KEY, scheme)
  } catch {
    // Storage can be blocked (private mode, site data disabled); the choice
    // still applies for this visit.
  }
}

/** Calls back when the system scheme changes; returns the unsubscribe. */
export function onSystemSchemeChange(
  callback: (scheme: ColorScheme) => void,
): () => void {
  const query = matchMedia(DARK_QUERY)
  const listener = (event: MediaQueryListEvent) =>
    callback(event.matches ? 'dark' : 'light')
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
