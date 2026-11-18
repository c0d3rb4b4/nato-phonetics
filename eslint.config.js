const js = require('@eslint/js');
const hooks = require('eslint-plugin-react-hooks');
const react = require('eslint-plugin-react');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'android/**', 'ios/**', 'artifacts/**', 'vendor/**', 'docs/evidence/**', 'web/service-worker.js'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest', sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, __DEV__: 'readonly' },
    },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] },
  },
  {
    files: ['app/**/*.js', 'src/**/*.js', 'web/**/*.jsx', 'index.web.js'],
    plugins: { 'react-hooks': hooks, react },
    rules: { 'react/jsx-uses-vars': 'error', 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  { files: ['**/*.cjs', '*config.js', 'scripts/*.js'], languageOptions: { sourceType: 'commonjs' } },
];
