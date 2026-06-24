const jwt = require('jsonwebtoken');
const jwtUtils = require('../../src/lib/jwt');
const config = require('../../src/config/config');

describe('jwt utils', () => {
  it('generates and verifies access tokens', () => {
    const token = jwtUtils.generateAccessToken({ id: 'user-id', role: 'user' });
    const payload = jwtUtils.verifyAccessToken(token);

    expect(payload.id).toBe('user-id');
    expect(payload.role).toBe('user');
  });

  it('generates and verifies refresh tokens', () => {
    const token = jwtUtils.generateRefreshToken({ id: 'user-id' });
    const payload = jwtUtils.verifyRefreshToken(token);

    expect(payload.id).toBe('user-id');
  });

  it('generates an access/refresh token pair', () => {
    const tokens = jwtUtils.generateTokens({ id: 'user-id' });

    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
  });

  it('throws for expired access tokens', () => {
    const token = jwt.sign({ id: 'user-id' }, config.jwtAccessSecret, { expiresIn: '-1s' });

    expect(() => jwtUtils.verifyAccessToken(token)).toThrow('Invalid or expired access token');
  });

  it('throws for invalid refresh tokens', () => {
    expect(() => jwtUtils.verifyRefreshToken('not-a-token')).toThrow('Invalid or expired refresh token');
  });
});
