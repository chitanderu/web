import { describe, expect, it } from 'vitest'

import { buildNotePath } from './note-route'

describe('buildNotePath', () => {
  it('prefers the slug route when slug and created exist', () => {
    expect(
      buildNotePath({
        nid: 42,
        slug: 'hello-note',
        created: '2026-03-14T12:00:00.000Z',
      }),
    ).toBe('/notes/2026/3/14/hello-note')
  })

  it('falls back to the nid route when slug data is missing', () => {
    expect(
      buildNotePath({
        nid: 42,
      }),
    ).toBe('/notes/42')
  })

  it('preserves the password query string', () => {
    expect(
      buildNotePath({
        nid: 42,
        slug: 'hello-note',
        created: '2026-03-14T12:00:00.000Z',
        password: 'open sesame',
      }),
    ).toBe('/notes/2026/3/14/hello-note?password=open+sesame')
  })
})
