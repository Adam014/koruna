import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import headers from '../public/_headers?raw'

async function sha256(text: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

describe('Content-Security-Policy', () => {
  it('allows the inline colour scheme script by its current hash', async () => {
    const inline = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1]
    expect(inline).toBeDefined()

    const hash = await sha256(inline ?? '')
    expect(headers).toContain(`'sha256-${hash}'`)
  })
})
