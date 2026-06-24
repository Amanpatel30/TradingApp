const { REDACTED, sanitizeObject } = require('../../src/utils/sanitizer');

describe('sanitizeObject', () => {
  it('redacts exact sensitive fields', () => {
    const result = sanitizeObject({ email: 'a@test.com', password: 'secret', accessToken: 'abc' });

    expect(result).toEqual({
      email: 'a@test.com',
      password: REDACTED,
      accessToken: REDACTED,
    });
  });

  it('redacts sensitive fields in nested objects', () => {
    const result = sanitizeObject({ profile: { refreshToken: 'refresh-token', safe: true } });

    expect(result).toEqual({ profile: { refreshToken: REDACTED, safe: true } });
  });

  it('redacts sensitive fields in arrays of objects', () => {
    const result = sanitizeObject({ sessions: [{ token: 'one' }, { token: 'two', id: 2 }] });

    expect(result).toEqual({ sessions: [{ token: REDACTED }, { token: REDACTED, id: 2 }] });
  });

  it('uses exact-key matching only', () => {
    const result = sanitizeObject({ passwordHint: 'pet name', refreshTokenValue: 'safe-ish' });

    expect(result).toEqual({ passwordHint: 'pet name', refreshTokenValue: 'safe-ish' });
  });

  it('prevents prototype pollution keys from being copied', () => {
    const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true},"safe":"ok"}');
    const result = sanitizeObject(payload);

    expect(result).toEqual({ safe: 'ok' });
    expect({}.polluted).toBeUndefined();
  });

  it('safely handles circular objects', () => {
    const input = { email: 'safe@test.com' };
    input.self = input;

    expect(sanitizeObject(input)).toEqual({ email: 'safe@test.com', self: '[Circular]' });
  });
});
