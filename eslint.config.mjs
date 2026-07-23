import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

/**
 * Flat ESLint config. eslint-config-next (16.x) ships ready-made
 * flat-config arrays under subpath exports, so there's no need for
 * the legacy FlatCompat/.eslintrc-shim bridge — that combination is
 * incompatible with this ESLint version (eslint-plugin-react's flat
 * config has an internal self-reference that FlatCompat's schema
 * validator can't safely serialize, producing a "Converting circular
 * structure to JSON" crash before linting even starts).
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
