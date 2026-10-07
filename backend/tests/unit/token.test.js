const { signAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } = require('../../src/utils/token');

describe('token utils', () => {
  it('signs and verifies access tokens with sub and role', () => {
    const payload = verifyAccessToken(signAccessToken({ id: 'u1', role: 'admin' }));
    expect(payload).toMatchObject({ sub: 'u1', role: 'admin' });
  });

  it('refresh tokens are unique and not valid as access tokens', () => {
    const a = generateRefreshToken('u1');
    const b = generateRefreshToken('u1');
    expect(a.token).not.toBe(b.token);
    expect(verifyRefreshToken(a.token).sub).toBe('u1');
    expect(() => verifyAccessToken(a.token)).toThrow();
  });

  it('hashes deterministically and never returns the raw token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toContain('abc');
  });
});
