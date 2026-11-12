/** "2026-11-12" -> "12 November 2026", shown next to the rates list. */
export function formatFixingDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { dateStyle: 'long' })
}
