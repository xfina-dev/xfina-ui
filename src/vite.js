// The Vite plugin every xfina.dev site uses:
//
//   // vite.config.js
//   import xfina from "xfina-ui/vite";
//   export default { plugins: [vue(), xfina()] };
//
// It puts the theme script inline at the top of <head>, so light or dark is
// decided before the first paint and a dark-mode reader never sees a white
// flash. A component, or a deferred module, would run too late for that.

import { readFileSync } from "node:fs";

const script = readFileSync(new URL("./theme-script.js", import.meta.url), "utf8");

export default function xfina() {
  return {
    name: "xfina-ui",
    transformIndexHtml: () => [{ tag: "script", children: script, injectTo: "head-prepend" }],
  };
}
