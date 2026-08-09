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
  // Server code logs through pino (src/modules/core/infrastructure/logger.ts), never
  // console.*: console output skips LOG_REDACT_PATHS and the request-scoped
  // loggerContext, so it can leak secrets and cannot be traced back to a request.
  {
    files: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**",
      // Next.js error boundaries are client components by definition; they run in the
      // browser, where the server logger does not exist and console is the only sink.
      "app/**/error.tsx",
      "app/**/global-error.tsx",
    ],
    rules: {
      "no-console": "error",
    },
  },
]);

export default eslintConfig;
