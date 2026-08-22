// https://eslint.nuxt.com
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // Le projet s'appuie sur l'auto-import Nuxt et un typage strict.
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
});
