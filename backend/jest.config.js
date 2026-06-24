module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  clearMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/lib/jwt.js',
    'src/utils/password.js',
    'src/utils/response.js',
    'src/utils/sanitizer.js',
    'src/modules/auth/validations/auth.schema.js',
    'src/modules/trades/validations/trade-history.schema.js',
    'src/modules/trades/services/get-trade-history-service.js',
    'src/modules/portfolio/controllers/get-portfolio-controller.js',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
