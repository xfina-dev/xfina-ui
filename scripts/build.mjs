// Builds dist/ from src/. `--check` builds to memory and fails if dist/ differs,
// which is how CI catches a source change committed without its build. Sites
// copy dist/ as it is, so it has to be what src/ says.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

function css() {
  const dark = declarations(colours.dark, "    ");
  return `/* xfina-ui ${version}. Generated from src/tokens.js and src/base.css; do not edit. */

:root {
  color-scheme: light;
${declarations(colours.light, "  ")}
${declarations(constants, "  ")}
}

/* Dark is declared twice, with the same values. The class is what
   xfina-theme.js sets, and what Tailwind's darkMode: 'class' reads. The media
   query covers readers without JavaScript; it stands down once the theme
   script has marked the page .light. */
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
}

// The logo is inlined into the header so no site has to serve it at a known
// path. Whitespace between tags goes; nothing inside a tag changes.
const logo = read("src/logo.svg").replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();

function js() {
  const source = read("src/xfina-ui.js");
  for (const placeholder of ["__VERSION__", "__LOGO__"]) {
    if (source.split(placeholder).length !== 2) throw new Error(`src/xfina-ui.js must use ${placeholder} exactly once`);
  }
  return `/* xfina-ui ${version} */\n${source
    .replace("__VERSION__", JSON.stringify(version))
    .replace("__LOGO__", JSON.stringify(logo))}`;
}

const files = {
  "xfina-ui.css": css(),
  "xfina-ui.js": js(),
  "xfina-theme.js": `/* xfina-ui ${version} */\n${read("src/xfina-theme.js")}`,
  "logo.svg": `${logo}\n`,
};

// Sites vendor these files, and check their copy against this list, so a
// hand-edited copy cannot pass for a release.
const sha = (text) => createHash("sha256").update(text).digest("hex");
files.SHA256SUMS = `${Object.entries(files)
  .map(([name, text]) => `${sha(text)}  ${name}`)
  .join("\n")}\n`;

if (process.argv.includes("--check")) {
  const stale = Object.entries(files).filter(([name, text]) => {
    try {
      return readFileSync(join(root, "dist", name), "utf8") !== text;
    } catch {
      return true;
    }
  });
  if (stale.length) {
    console.error(`dist/ is out of date: ${stale.map(([name]) => name).join(", ")}. Run \`npm run build\` and commit.`);
    process.exit(1);
  }
  console.log("dist/ matches src/.");
} else {
  mkdirSync(join(root, "dist"), { recursive: true });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(root, "dist", name), text);
  console.log(`Built xfina-ui ${version}: ${Object.keys(files).join(", ")}`);
}
