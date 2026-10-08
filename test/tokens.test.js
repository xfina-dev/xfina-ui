// @vitest-environment node
// The tokens, whatever their values: both modes define the same names, and
// what the build writes is the colour the source asked for.

import { test } from "vitest";
import assert from "node:assert/strict";
import { chartByHue, chartSlots, colours, constants } from "../src/tokens.js";
import { triplet } from "../scripts/colour.mjs";

// The inverse of triplet(), so a hex token can be checked against its output.
function rgb(value) {
  const [h, s, l] = value.replace(/%/g, "").split(" ").map(Number);
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

test("light and dark define exactly the same tokens", () => {
  assert.deepEqual(Object.keys(colours.dark).sort(), Object.keys(colours.light).sort());
});

test("no token is both a colour and a constant", () => {
  for (const name of Object.keys(constants)) assert.ok(!(name in colours.light), name);
});

test("every hex token survives conversion to a triplet within one step", () => {
  for (const tokens of [colours.light, colours.dark]) {
    for (const [name, value] of Object.entries(tokens)) {
      if (!value.startsWith("#")) continue;
      const source = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
      const built = rgb(triplet(value));
      source.forEach((channel, i) =>
        assert.ok(Math.abs(channel - built[i]) <= 1, `${name} ${value} became ${triplet(value)}`),
      );
    }
  }
});

test("every colour is a hex or an HSL triplet", () => {
  for (const tokens of [colours.light, colours.dark]) {
    for (const [name, value] of Object.entries(tokens)) {
      assert.match(value, /^(#[0-9a-f]{6}|\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%)$/, name);
    }
  }
});

test("the chart palette keeps its sixteen slots in order", () => {
  for (const tokens of [colours.light, colours.dark]) {
    const slots = Object.keys(tokens).filter((name) => name.startsWith("chart-"));
    assert.deepEqual(slots, Array.from({ length: 16 }, (_, i) => `chart-${i + 1}`));
  }
  assert.equal(chartSlots, 16);
});

test("the picker's hue order is every slot once, around the colour wheel in both modes", () => {
  assert.deepEqual([...chartByHue].sort((a, b) => a - b), Array.from({ length: chartSlots }, (_, i) => i + 1));
  // OKLCH hue, from sRGB through OKLab.
  const hue = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  };
  for (const mode of ["light", "dark"]) {
    const hues = chartByHue.map((n) => hue(colours[mode][`chart-${n}`]));
    // Once around the wheel: going round the list, the hue falls back exactly
    // once (where it passes 360°), however each mode places the start.
    const falls = hues.filter((h, i) => hues[(i + 1) % hues.length] < h).length;
    assert.equal(falls, 1, `${mode}: ${hues.map((h) => h.toFixed(0)).join(" ")}`);
  }
});

test("status text reads at 4.5:1 on its badge's tint, in both modes", () => {
  // Badges set small bold text on a 12% tint of their status over the page
  // surface. The status colours are too light for that on white, which is why
  // each has a -text step; this holds every step to WCAG's 4.5:1.
  const hex = (v) => [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const surfaces = { light: "#ffffff", dark: "#09090b" };
  for (const [mode, surface] of Object.entries(surfaces)) {
    for (const status of ["good", "warning", "serious", "critical"]) {
      const tint = hex(colours[mode][`status-${status}`]).map((c, i) => Math.round(c * 0.12 + hex(surface)[i] * 0.88));
      const ratio = contrast(hex(colours[mode][`status-${status}-text`]), tint);
      assert.ok(ratio >= 4.5, `${mode} ${status}: ${ratio.toFixed(2)}:1`);
    }
  }
});

test("the brand blue reads as a button, as an outline and as text, in both modes", () => {
  const hex = (v) => [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [x, y] = [luminance(hex(a)), luminance(hex(b))].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const tint = (fg, bg, a) => "#" + hex(fg).map((c, i) => Math.round(c * a + hex(bg)[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
  for (const [mode, page] of Object.entries({ light: "#ffffff", dark: "#09090b" })) {
    const t = colours[mode];
    // A default button's label.
    assert.ok(contrast(t["primary-foreground"], t.primary) >= 4.5, `${mode} button text`);
    // A selected outline against the page: 3:1 for a non-text control.
    assert.ok(contrast(t.primary, page) >= 3, `${mode} outline`);
    // Blue text on the page and on a badge's tint.
    assert.ok(contrast(t["primary-text"], page) >= 4.5, `${mode} text on the page`);
    assert.ok(contrast(t["primary-text"], tint(t.primary, page, 0.1)) >= 4.5, `${mode} text on a tint`);
  }
});
