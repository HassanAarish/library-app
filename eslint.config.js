const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const betterTailwind = require("eslint-plugin-better-tailwindcss");
const globals = require("globals");

// Tailwind rules load the design system in a worker; give a busy machine time.
process.env.SYNCKIT_TIMEOUT ??= "180000";

module.exports = defineConfig([
  globalIgnores(["dist/*", ".expo/*", "android/*", "ios/*", "src/uniwind-types.d.ts"]),
  expoConfig,
  {
    settings: {
      // "@/..." imports map to src/ (jsconfig.json), as in Metro and Jest.
      "import/resolver": { typescript: { project: "./jsconfig.json" } },
    },
  },
  {
    files: ["**/*.test.{js,jsx}"],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ["**/*.{js,jsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      // The lint entry declares the theme token names (bg-canvas, text-fg…),
      // which plain Tailwind can't read from Uniwind's per-theme blocks.
      "better-tailwindcss": { entryPoint: "src/theme-lint.css" },
    },
    rules: {
      // Same Tailwind gate as the website: lint fails until classes are fixed
      // (most fix themselves with `npm run lint:fix`).
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-unnecessary-whitespace": "error",
      // left/right → start/end so layouts mirror for Urdu (RTL); vertical and
      // size classes never flip, so they keep their usual names.
      "better-tailwindcss/enforce-logical-properties": [
        "error",
        {
          ignore: [
            "^([\\w-]+:)*-?(m[tb]|p[tb]|top|bottom|h|w|size|min-[hw]|max-[hw]|border-[tb]|inset-[xy])(-.+)?$",
          ],
        },
      ],
    },
  },
]);
