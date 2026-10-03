// The tokens, whatever their values: both modes define the same names, and
// what the build writes is the colour the source asked for.

import { test } from "node:test";
import assert from "node:assert/strict";
import { colours, constants } from "../src/tokens.js";
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

test("the chart palette keeps its eight slots in order", () => {
  for (const tokens of [colours.light, colours.dark]) {
    const slots = Object.keys(tokens).filter((name) => name.startsWith("chart-"));
    assert.deepEqual(slots, ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"]);
  }
});
