import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { JwtTokenService } from './jwt-token.service'

describe('JwtTokenService', () => {
  let svc: JwtTokenService

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) =>
              k === 'jwtSecret' ? 'test-access-secret-32chars!!' : 'test-refresh-secret-32chars!!',
          },
        },
      ],
    }).compile()
    svc = mod.get(JwtTokenService)
  })

  it('signs access and verifies', () => {
    const r = svc.signAccess({
      sub: 'u1',
      username: 'alice',
      permissions: ['user:read'],
    })
    const p = svc.verifyAccess(r.token)
    expect(p.sub).toBe('u1')
    expect(p.permissions).toEqual(['user:read'])
  })

  it('signs refresh and verifies', () => {
    const r = svc.signRefresh('u1')
    const p = svc.verifyRefresh(r.token)
    expect(p.sub).toBe('u1')
  })

  it('sha256 is stable', () => {
    expect(svc.sha256('a')).toBe(svc.sha256('a'))
  })

  it('rejects wrong access typ', () => {
    const jwt = require('jsonwebtoken')
    const bad = jwt.sign(
      { sub: 'u', username: 'x', jti: 'j', typ: 'refresh', permissions: [] },
      'test-access-secret-32chars!!',
      { expiresIn: 60, algorithm: 'HS256' },
    )
    expect(() => svc.verifyAccess(bad)).toThrow()
  })
})
