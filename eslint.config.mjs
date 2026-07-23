import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // design_handoff_*: prototipos de referencia, no codigo
  { ignores: [".next/**", "design_handoff_identidad_marcador/**", "design_handoff_fase2/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
