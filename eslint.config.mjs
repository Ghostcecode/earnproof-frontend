import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Playwright fixtures use a `use(...)` callback parameter per the
    // official fixture API — it is not a React hook, but the name
    // pattern-matches react-hooks/rules-of-hooks. This code never renders
    // React components, so the React-specific rules do not apply here.
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    // The performance budget scripts are plain Node CommonJS tooling that
    // runs directly via `node scripts/performance/*.js` in CI, outside the
    // Next.js bundler, so CommonJS `require`/`module.exports` is the
    // correct pattern here rather than an app-code smell.
    files: [
      "scripts/performance/**/*.js",
      "scripts/generate-api-types/**/*.js",
      "scripts/check-api-drift.js",
      "lib/api/generated/**/*.ts",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
