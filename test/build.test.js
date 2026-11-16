// @vitest-environment node
// What a site gets from the package: the preset generates every class the
// components use, and the Vite plugin puts the theme script in <head>.

import { describe, expect, test } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import preset from "../src/tailwind.js";
import xfina from "../src/vite.js";
import { colours } from "../src/tokens.js";
import * as barrel from "@/index.js";
import * as seriesExplorer from "@/series-explorer.js";

const src = fileURLToPath(new URL("../src", import.meta.url));

async function compile(css) {
  const result = await postcss([
    tailwindcss({ presets: [preset], content: [`${src}/**/*.{vue,js}`] }),
  ]).process(css, { from: undefined });
  return result.css;
}

describe("the Tailwind preset", () => {
  test("maps every token to a colour, with opacity modifiers", () => {
    const mapped = preset.theme.extend.colors;
    expect(Object.keys(mapped).sort()).toEqual(Object.keys(colours.light).sort());
    for (const [name, value] of Object.entries(mapped)) {
      expect(value).toBe(`hsl(var(--${name}) / <alpha-value>)`);
    }
  });

  test("generates the token classes the components use", async () => {
    const css = await compile("@tailwind utilities;");
    // A misspelt colour class generates nothing and leaves a component
    // uncoloured, which only the eye would catch.
    for (const cls of [
      ".bg-primary",
      ".text-primary-foreground",
      ".border-input",
      ".bg-popover",
      ".text-muted-foreground",
      ".text-status-warning-text",
      ".bg-status-good\\/\\[0\\.12\\]",
      ".border-status-critical\\/40",
      ".bg-primary\\/10",
      // ColorPicker's marks, drawn in the popover's colours in both modes.
      ".border-popover",
      ".bg-popover-foreground",
      ".ring-offset-popover",
      // Segmented's sizes, which are arbitrary values.
      ".h-\\[30px\\]",
      ".h-\\[42px\\]",
      ".p-\\[3px\\]",
    ]) {
      expect(css, cls).toContain(cls);
    }
  });

  test("sets borders, page and placeholders from the tokens, after preflight", async () => {
    const css = await compile("@tailwind base;");
    const preflight = css.indexOf("border-color: #e5e7eb");
    const ours = css.indexOf("border-color: hsl(var(--border))");
    expect(preflight).toBeGreaterThan(-1);
    expect(ours).toBeGreaterThan(preflight);
    expect(css).toContain("background-color: hsl(var(--background))");
  });
});

describe("the Vite plugin", () => {
  test("puts the theme script inline, first in <head>", () => {
    const [tag] = xfina().transformIndexHtml();
    expect(tag.tag).toBe("script");
    expect(tag.injectTo).toBe("head-prepend");
    expect(tag.children).toBe(readFileSync(new URL("../src/theme-script.js", import.meta.url), "utf8"));
    expect(tag.attrs?.src).toBeUndefined();
  });
});

const isDirectory = (path) => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

// Every module `import`ed or `import()`ed from `file`, by its path on disk.
function importsOf(file) {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)].map((m) => m[1]);
}

// The modules reachable from an entry point, following its own files only.
function graph(entry) {
  const seen = new Map();
  const walk = (file) => {
    if (seen.has(file)) return;
    const specifiers = importsOf(file);
    seen.set(file, specifiers);
    for (const specifier of specifiers) {
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) continue;
      if (specifier.includes("?")) continue; // an asset, such as the logo as raw SVG
      let path = specifier.startsWith("@/") ? join(src, specifier.slice(2)) : resolve(dirname(file), specifier);
      // A bare directory is its index.js, as a bundler resolves it.
      if (!path.endsWith(".js") && !path.endsWith(".vue")) {
        path = isDirectory(path) ? join(path, "index.js") : `${path}.js`;
      }
      walk(path);
    }
  };
  walk(entry);
  return seen;
}

describe("the two entry points", () => {
  // Labs upgraded to 0.10.0 and its build failed with eleven MISSING_EXPORT
  // errors against Vite's optional-peer stub, for a component it does not
  // mount: the explorer's ECharts module is imported dynamically, but its own
  // imports are static, so a bundler resolves them while building the main
  // barrel. ECharts is reachable from the explorer's entry point and from
  // nowhere else, and that is what keeps the peer dependency optional.
  test("the main barrel reaches no ECharts; the explorer's entry point does", () => {
    const names = (modules) => [...modules.values()].flat().filter((s) => s.startsWith("echarts"));
    expect(names(graph(join(src, "index.js")))).toEqual([]);
    expect(names(graph(join(src, "series-explorer.js"))).sort()).toEqual([
      "echarts/charts",
      "echarts/components",
      "echarts/core",
      "echarts/renderers",
    ]);
  });

  test("SeriesExplorer is exported from its subpath, not from the package root", () => {
    expect(Object.keys(seriesExplorer).sort()).toEqual(["SeriesExplorer", "rowsFromCsv"]);
    expect(Object.keys(barrel)).not.toContain("SeriesExplorer");
    expect(Object.keys(barrel)).not.toContain("rowsFromCsv");
  });

  test("the package publishes the subpath it tells sites to import", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(pkg.exports["./series-explorer"]).toBe("./dist/series-explorer.js");
    expect(pkg.peerDependenciesMeta.echarts.optional).toBe(true);
  });
});
