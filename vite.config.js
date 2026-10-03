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
    lib: { entry: "src/index.js", formats: ["es"], fileName: "index" },
    rollupOptions: {
      external: [
        "vue",
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
