import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import xfina from "../src/tailwind.js";

// A site lists ./node_modules/xfina-ui/dist/**/*.js; the demo builds from
// source, so it lists src/ instead. Paths are built with path, not URL: a URL
// would percent-encode the glob's braces and match nothing.
const here = dirname(fileURLToPath(import.meta.url));

export default {
  presets: [xfina],
  content: [resolve(here, "index.html"), resolve(here, "*.vue"), resolve(here, "../src/**/*.{vue,js}")],
};
