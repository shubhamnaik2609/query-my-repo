import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  // {
  //   ignores: [".next"],
  // },
  // ...compat.extends("next/core-web-vitals"),
  // {
  //   files: ["**/*.ts", "**/*.tsx"],
  // },
  {
    // linterOptions: {
    //   reportUnusedDisableDirectives: true,
    // },
    // languageOptions: {
    //   parserOptions: {
    //     projectService: true,
    //   },
    // },
  },
);
