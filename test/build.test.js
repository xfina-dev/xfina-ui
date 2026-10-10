// @vitest-environment node
// What a site gets from the package: the preset generates every class the
// components use, and the Vite plugin puts the theme script in <head>.

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import preset from "../src/tailwind.js";
import xfina from "../src/vite.js";
import { colours } from "../src/tokens.js";

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
