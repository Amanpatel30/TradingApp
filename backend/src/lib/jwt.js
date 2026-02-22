const jwt = require('jsonwebtoken');
const config = require('../config/config');

class JWTUtils {
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwtAccessSecret, {
      expiresIn: config.jwtAccessExpiry,
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiry,
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwtAccessSecret);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  generateTokens(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }
}

module.exports = new JWTUtils();
