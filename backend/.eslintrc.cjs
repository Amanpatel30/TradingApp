module.exports = {
  root: true,
  env: {
    node: true,
    commonjs: true,
    es2022: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:promise/recommended'],
  plugins: ['promise', 'security', 'unused-imports'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'logs/'],
  rules: {
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-cond-assign': ['error', 'always'],
    'no-unsafe-finally': 'error',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'consistent-return': 'warn',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-prototype-builtins': 'error',
    'no-return-await': 'warn',
    'require-atomic-updates': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'security/detect-non-literal-require': 'off',
      },
    },
  ],
};
