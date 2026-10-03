// Light and dark: the OS decides until the reader chooses, and the choice
// follows them across every xfina.dev site.

import { test } from "node:test";
import assert from "node:assert/strict";
import { page } from "./helpers.js";

const classes = (window) => [...window.document.documentElement.classList].sort().join(" ");

test("with no choice made, the page follows the OS", () => {
  const light = page({ osDark: false });
  light.theme();
  assert.equal(classes(light.window), "light");

  const dark = page({ osDark: true });
  dark.theme();
  assert.equal(classes(dark.window), "dark");
});

test("an OS change is followed until the reader chooses", () => {
  const p = page({ osDark: false });
  p.theme();
  p.setOsDark(true);
  assert.equal(classes(p.window), "dark");

  p.window.xfinaTheme.toggle();
  assert.equal(classes(p.window), "light");
  p.setOsDark(false);
  p.setOsDark(true);
  assert.equal(classes(p.window), "light", "the reader's choice outlasts the OS");
});

test("a choice made on one xfina.dev site holds on the others", () => {
  const data = page({ url: "https://data.xfina.dev/datasets/in-cpi/" });
  data.theme();
  data.window.xfinaTheme.toggle();
  assert.equal(classes(data.window), "dark");

  for (const url of ["https://xfina.dev/", "https://labs.xfina.dev/backtest/"]) {
    const other = page({ url, cookieJar: data.cookieJar });
    other.theme();
    assert.equal(classes(other.window), "dark", url);
  }
});

test("off xfina.dev the choice stays on this origin, in localStorage", () => {
  const p = page({ url: "http://localhost:5173/" });
  p.theme();
  p.window.xfinaTheme.toggle();
  assert.equal(p.window.localStorage.getItem("xfina-theme"), "dark");
  assert.equal(p.window.document.cookie, "");
});

test("every change is announced, for charts that redraw in the other palette", () => {
  const p = page();
  const seen = [];
  p.window.addEventListener("themechange", (event) => seen.push(event.detail.dark));
  p.theme();
  p.window.xfinaTheme.toggle();
  assert.deepEqual(seen, [false, true]);
});

test("loading the script twice installs it once", () => {
  const p = page();
  p.theme();
  const first = p.window.xfinaTheme;
  p.theme();
  assert.equal(p.window.xfinaTheme, first);
});
