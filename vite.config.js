// Builds the library into dist/: the components as one ES module, with Vue and
// the component libraries left to the site to install, so a site has one copy
// of each.

import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  plugins: [vue()],
  resolve: { alias },
  build: {
    // Two entry points. SeriesExplorer is apart from the rest because it is
    // the only component that imports ECharts: on the main barrel, its static
    // `echarts/*` imports would be resolved by every consumer's bundler,
    // including sites that have no ECharts installed and mount no explorer.
    lib: { entry: { index: "src/index.js", "series-explorer": "src/series-explorer.js" }, formats: ["es"] },
    rollupOptions: {
      external: [
        "vue",
        // ECharts, which only SeriesExplorer imports, and only in the
        // browser: the site installs it, so there is one copy of it.
        /^echarts/,
        "reka-ui",
        "@vueuse/core",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "lucide-vue-next",
      ],
    },
    // Not minified: the published file stays readable, and the site's own
    // build minifies it anyway.
    minify: false,
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.js"],
  },
});
