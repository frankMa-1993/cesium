import { describe, expect, it } from 'vitest'
import { decodeJwtPayload } from './jwt'

function makePart(payload: object) {
  return Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

describe('decodeJwtPayload', () => {
  it('parses permissions from mock jwt', () => {
    const part = makePart({ permissions: ['a'], username: 'x' })
    const token = `h.${part}.s`
    const p = decodeJwtPayload<{ permissions: string[]; username: string }>(token)
    expect(p?.permissions).toEqual(['a'])
    expect(p?.username).toBe('x')
  })
})
