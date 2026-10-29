module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  env: {
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
