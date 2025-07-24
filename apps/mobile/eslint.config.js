// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        typescript: {
          // Specify the path to your tsconfig.json if it's not in the root
          project: './tsconfig.json',
        },
      },
    },
  },
]);
