import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // src/native is the React Native compat layer. Each file stands in for an npm package,
    // so it deliberately exports components alongside plain functions and constants
    // (StyleSheet, Platform, Alert, …) — the shape the ported screens import. Props are
    // likewise destructured on purpose: naming an RN-only prop is what keeps it out of the
    // `...rest` spread and therefore off the DOM element.
    files: ['src/native/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
])
