// The component layer and the chart theme, whatever their values.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { colours, constants } from "../src/tokens.js";
import { page } from "./helpers.js";

const dist = (name) => readFileSync(new URL(`../dist/${name}`, import.meta.url), "utf8");
const defined = new Set([...Object.keys(colours.light), ...Object.keys(constants)]);

test("every token the CSS and the elements use is defined", () => {
  // A misspelt token resolves to nothing and draws a component without its
  // colour, which no test of the component itself would notice.
  for (const file of ["xfina-ui.css", "xfina-ui.js"]) {
    const used = new Set([...dist(file).matchAll(/var\(--([a-z0-9-]+)/g)].map((m) => m[1]));
    const missing = [...used].filter((name) => !defined.has(name));
    assert.deepEqual(missing, [], `${file} uses undefined tokens`);
  }
});

test("the shadcn replacements are all in the stylesheet", () => {
  const css = dist("xfina-ui.css");
  for (const cls of [
    "xf-btn", "xf-btn-outline", "xf-btn-secondary", "xf-btn-ghost", "xf-btn-destructive", "xf-btn-link",
    "xf-btn-sm", "xf-btn-lg", "xf-btn-icon",
    "xf-segmented",
    "xf-card", "xf-card-header", "xf-card-title", "xf-card-description", "xf-card-content", "xf-card-footer",
    "xf-input", "xf-input-sm", "xf-label",
    "xf-badge", "xf-badge-good", "xf-badge-warning", "xf-badge-critical", "xf-badge-soon",
    "xf-table", "xf-pre", "xf-prose", "xf-muted", "xf-sr-only", "xf-stack",
  ]) {
    assert.match(css, new RegExp(`\\.${cls}[\\s{,:.>[]`), cls);
  }
});

test("no component defines a colour of its own", () => {
  // Every colour comes from a token, so light and dark both work and a
  // palette change reaches every component. Shadows are the one exception:
  // shadcn draws them in black at low opacity in both modes.
  const css = readFileSync(new URL("../src/components.css", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/rgb\(0 0 0 \/ 0\.\d+\)/g, "");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\((?!var\()/);
});

test("the chart theme names its parts and refuses a missing token", () => {
  const p = page();
  p.theme();
  p.ui();
  const { chart } = p.window.XfinaUI;
  assert.equal(typeof chart.series, "function");
  assert.equal(typeof chart.ramp, "function");
  assert.equal(typeof chart.echarts, "function");
  // No stylesheet is loaded in this page, so no token is defined.
  assert.throws(() => chart.colour("--chart-1"), /--chart-1 is not defined; is xfina-ui.css loaded\?/);
});
