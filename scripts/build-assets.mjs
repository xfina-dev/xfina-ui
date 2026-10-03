// The parts of the package that are not components, written into dist/ after
// `vite build`: the token stylesheet, the Tailwind preset, the Vite plugin and
// the theme script it injects, and the logo.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { colours, constants } from "../src/tokens.js";
import { triplet } from "./colour.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const version = JSON.parse(read("package.json")).version;

const declarations = (tokens, indent) =>
  Object.entries(tokens)
    .map(([name, value]) => `${indent}--${name}: ${triplet(value)};`)
    .join("\n");

const dark = declarations(colours.dark, "    ");
const css = `/* xfina-ui ${version}. Generated from src/tokens.js and src/base.css; do not edit. */

:root {
  color-scheme: light;
${declarations(colours.light, "  ")}
${declarations(constants, "  ")}
}

/* Dark is declared twice, with the same values. The class is what the theme
   script sets, and what Tailwind's darkMode: 'class' reads. The media query
   covers readers without JavaScript; it stands down once the theme script has
   marked the page .light. */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    color-scheme: dark;
${dark}
  }
}
:root.dark {
  color-scheme: dark;
${dark.replace(/^ {2}/gm, "")}
}

${read("src/base.css")}`;

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/style.css"), css);
for (const file of ["tailwind.js", "tokens.js", "vite.js", "theme-script.js", "logo.svg"]) {
  copyFileSync(join(root, "src", file), join(root, "dist", file));
}
console.log(`xfina-ui ${version}: dist/style.css, tailwind.js, tokens.js, vite.js, theme-script.js, logo.svg`);
