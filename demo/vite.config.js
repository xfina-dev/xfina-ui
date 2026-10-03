// The demo gallery, built against the library's source rather than dist/, so
// a change shows up as it is made.

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import xfina from "../src/vite.js";
import { alias } from "../vite.config.js";

export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  plugins: [vue(), xfina()],
  resolve: { alias },
  // Inline, because Vite looks for a PostCSS config from the project root, and
  // the demo's Tailwind config lives beside it in demo/.
  css: {
    postcss: {
      plugins: [tailwindcss({ config: new URL("./tailwind.config.js", import.meta.url).pathname }), autoprefixer()],
    },
  },
  server: { port: 4310 },
});
