const jwt = require('jsonwebtoken');
const User = require('../../src/schema/user.model');
const config = require('../../src/config/config');
const { api } = require('../helpers/api');
const { authHeadersFor, buildUserPayload, createUser } = require('../helpers/factories');

describe('auth integration', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const response = await api()
        .post('/api/v1/auth/register')
        .send(buildUserPayload({ email: 'new-user@example.com' }))
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('new-user@example.com');
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));

      const user = await User.findOne({ email: 'new-user@example.com' }).select('+password +refreshToken');
      expect(user).toBeTruthy();
      expect(user.password).not.toBe('Demo@12345');
      expect(user.refreshToken).toBe(response.body.data.refreshToken);
    });

    it('rejects duplicate emails', async () => {
      await createUser({ email: 'duplicate@example.com' });

      const response = await api()
        .post('/api/v1/auth/register')
        .send(buildUserPayload({ email: 'duplicate@example.com' }))
        .expect(409);

      expect(response.body.message).toBe('User already exists with this email');
    });

    it('rejects invalid payloads', async () => {
      const response = await api()
        .post('/api/v1/auth/register')
        .send({ name: 'A', email: 'not-email', password: 'Demo@12345' })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('rejects weak passwords', async () => {
      const response = await api()
        .post('/api/v1/auth/register')
        .send(buildUserPayload({ password: 'weak' }))
        .expect(422);

      expect(response.body.errors.map((error) => error.message).join(' ')).toMatch(/at least 8/i);
    });

    it('rejects missing required fields', async () => {
      const response = await api()
        .post('/api/v1/auth/register')
        .send({ email: 'missing@example.com' })
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in a valid user', async () => {
      await createUser({ email: 'login@example.com', password: 'Demo@12345' });

      const response = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Demo@12345' })
        .expect(200);

      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));
    });

    it('rejects an unknown email', async () => {
      const response = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@example.com', password: 'Demo@12345' })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('rejects an invalid password', async () => {
      await createUser({ email: 'wrong-password@example.com', password: 'Demo@12345' });

      const response = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'wrong-password@example.com', password: 'Wrong@12345' })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('refreshes with a valid stored refresh token', async () => {
      await createUser({ email: 'refresh@example.com', password: 'Demo@12345' });
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'refresh@example.com', password: 'Demo@12345' })
        .expect(200);

      const response = await api()
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: login.body.data.refreshToken })
        .expect(200);

      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));
    });

    it('rejects an invalid refresh token', async () => {
      const response = await api()
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'not-a-token' })
        .expect(401);

      expect(response.body.message).toMatch(/refresh token/i);
    });

    it('rejects an expired refresh token', async () => {
      const expiredToken = jwt.sign({ id: 'user-id' }, config.jwtRefreshSecret, { expiresIn: '-1s' });

      const response = await api()
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.message).toMatch(/refresh token/i);
    });
  });

  describe('protected auth routes', () => {
    it('rejects unauthorized access', async () => {
      await api().get('/api/v1/auth/me').expect(401);
    });

    it('allows valid access to the current user', async () => {
      const { user } = await createUser({ email: 'me@example.com' });

      const response = await api()
        .get('/api/v1/auth/me')
        .set(authHeadersFor(user))
        .expect(200);

      expect(response.body.data.user.email).toBe('me@example.com');
    });

    it('clears refresh token on logout', async () => {
      await createUser({ email: 'logout@example.com', password: 'Demo@12345' });
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'logout@example.com', password: 'Demo@12345' })
        .expect(200);

      await api()
        .post('/api/v1/auth/logout')
        .set({ Authorization: `Bearer ${login.body.data.accessToken}` })
        .expect(200);

      await api()
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: login.body.data.refreshToken })
        .expect(401);
    });

    it('validates profile updates', async () => {
      const { user } = await createUser({ email: 'profile@example.com' });

      await api()
        .patch('/api/v1/auth/profile')
        .set(authHeadersFor(user))
        .send({ avatarColor: '#000000' })
        .expect(422);

      const response = await api()
        .patch('/api/v1/auth/profile')
        .set(authHeadersFor(user))
        .send({ name: 'Profile Trader', avatarLabel: 'pt', avatarColor: '#2563EB' })
        .expect(200);

      expect(response.body.data.user.name).toBe('Profile Trader');
      expect(response.body.data.user.avatarLabel).toBe('PT');
    });
  });
});
