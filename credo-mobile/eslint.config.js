// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // These fire on legitimate, correct RN patterns this codebase relies on:
      //  - set-state-in-effect / exhaustive-deps: standard fetch-on-mount data loading
      //  - immutability: Reanimated shared-value writes (`sharedValue.value = ...`)
      // Kept as warnings so real problems still surface without failing on idiomatic code.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);
