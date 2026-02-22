const { register } = require('./register-service');
const { login } = require('./login-service');
const { refreshToken } = require('./refresh-token-service');
const { logout } = require('./logout-service');

class AuthService {
  async register(userData) {
    return await register(userData);
  }

  async login(email, password) {
    return await login(email, password);
  }

  async refreshToken(oldRefreshToken) {
    return await refreshToken(oldRefreshToken);
  }

  async logout(userId) {
    return await logout(userId);
  }
}

module.exports = { authService: new AuthService() };
