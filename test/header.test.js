// <xfina-header> and <xfina-footer>: one header for every site, marking where
// the reader is.

import { test } from "node:test";
import assert from "node:assert/strict";
import { page } from "./helpers.js";

function mount(markup, options) {
  const p = page({ ...options, body: markup });
  p.theme();
  p.ui();
  return p;
}

const shadow = (p, selector) => p.window.document.querySelector(selector).shadowRoot;

test("every site gets its own title, and the switcher leaves it out", () => {
  for (const site of ["xfina", "data", "labs"]) {
    const p = mount(`<xfina-header site="${site}"></xfina-header>`);
    const root = shadow(p, "xfina-header");
    const entry = p.window.XfinaUI.SITES.find((s) => s.id === site);
    assert.equal(root.querySelector(".name").textContent, entry.title);
    const targets = [...root.querySelectorAll(".sites a")].map((a) => a.href);
    assert.ok(!targets.includes(entry.url), `${site} does not link to itself`);
    assert.equal(targets.length, p.window.XfinaUI.FAMILY.length - 1);
    assert.equal(root.querySelector('a[title="GitHub repository"]').href, `https://github.com/${entry.repo}`);
  }
});

test("the switcher lists the rest of the family in order, the flagship first", () => {
  const expected = {
    xfina: ["Labs", "Xfingine", "Data"],
    labs: ["Xfina", "Xfingine", "Data"],
    data: ["Xfina", "Labs", "Xfingine"],
  };
  for (const [site, labels] of Object.entries(expected)) {
    const p = mount(`<xfina-header site="${site}"></xfina-header>`);
    const entries = [...shadow(p, "xfina-header").querySelectorAll(".sites a")];
    assert.deepEqual(entries.map((a) => a.firstChild.textContent), labels, site);
  }
});

test("Xfingine has no site, so it opens its repository in a new tab", () => {
  const p = mount('<xfina-header site="xfina"></xfina-header>');
  const entries = [...shadow(p, "xfina-header").querySelectorAll(".sites a")];
  const xfingine = entries.find((a) => a.href === "https://github.com/xfina-dev/xfingine");
  assert.equal(xfingine.href, "https://github.com/xfina-dev/xfingine");
  assert.equal(xfingine.target, "_blank");
  assert.equal(xfingine.rel, "noopener noreferrer");
  assert.match(xfingine.textContent, /opens in a new tab/);
  // The sites stay in this tab.
  for (const a of entries.filter((a) => a !== xfingine)) assert.equal(a.target, "", a.href);
});

test("a misspelt site fails loudly instead of drawing a header for no site", () => {
  const p = page({ body: "" });
  p.theme();
  p.ui();
  const element = p.window.document.createElement("xfina-header");
  element.setAttribute("site", "dat");
  assert.throws(() => element.connectedCallback(), /unknown site; expected one of xfina, labs, data/);

  element.setAttribute("site", "xfingine");
  assert.throws(() => element.connectedCallback(), /unknown site/, "Xfingine is a link, not a site");
});

test("the site's own picker and tagline go in slots", () => {
  const p = mount(`
    <xfina-header site="labs">
      <select slot="context"><option>Backtest</option></select>
      <span slot="tagline">Multi-asset portfolio backtester.</span>
    </xfina-header>`);
  const root = shadow(p, "xfina-header");
  const context = root.querySelector('slot[name="context"]').assignedElements();
  assert.equal(context[0].localName, "select");
  const tagline = root.querySelector('slot[name="tagline"]').assignedElements();
  assert.equal(tagline[0].textContent, "Multi-asset portfolio backtester.");
});

test("the title is a heading only when the page asks for one", () => {
  const plain = mount('<xfina-header site="data"></xfina-header>');
  assert.equal(shadow(plain, "xfina-header").querySelector(".name").localName, "span");
  const heading = mount('<xfina-header site="xfina" heading></xfina-header>');
  assert.equal(shadow(heading, "xfina-header").querySelector(".name").localName, "h1");
});

test("the theme button toggles, and its icon follows the page", () => {
  const p = mount('<xfina-header site="data"></xfina-header>');
  const root = shadow(p, "xfina-header");
  const sun = root.querySelector(".when-dark");
  assert.equal(sun.style.display, "none", "a light page shows the moon");
  root.querySelector('[data-action="theme"]').click();
  assert.ok(p.window.document.documentElement.classList.contains("dark"));
  assert.equal(sun.style.display, "", "a dark page shows the sun");
});

test("without the theme script, the toggle is hidden and the omission reported", () => {
  const p = page({ body: '<xfina-header site="data"></xfina-header>' });
  p.ui();
  const toggle = shadow(p, "xfina-header").querySelector('[data-action="theme"]');
  assert.equal(toggle.hidden, true);
  assert.match(p.window.errors[0], /xfina-theme.js is not loaded/);
});

test("privacy opens the built-in dialog unless the site handles it", () => {
  const plain = mount('<xfina-header site="data"></xfina-header>');
  const root = shadow(plain, "xfina-header");
  root.querySelector('[data-action="privacy"]').click();
  assert.ok(root.querySelector("dialog").hasAttribute("open"));
  assert.match(root.querySelector("dialog").textContent, /data\.xfina\.dev runs no analytics/);

  const handled = mount('<xfina-header site="xfina"></xfina-header>');
  let asked = 0;
  handled.window.document.addEventListener("xfina-privacy", (event) => {
    asked += 1;
    event.preventDefault();
  });
  const handledRoot = shadow(handled, "xfina-header");
  handledRoot.querySelector('[data-action="privacy"]').click();
  assert.equal(asked, 1);
  assert.ok(!handledRoot.querySelector("dialog").hasAttribute("open"), "the site's own dialog is used instead");
});

test("the footer links every site and marks this one", () => {
  const p = mount('<xfina-footer site="labs"></xfina-footer>');
  const root = shadow(p, "xfina-footer");
  const links = [...root.querySelectorAll("nav a")].map((a) => [a.textContent, a.getAttribute("aria-current")]);
  assert.deepEqual(links, [["Xfina", null], ["Xfina Labs", "page"], ["Xfingine on GitHub", null], ["Xfina Data", null]]);
  assert.equal(root.querySelectorAll("nav a")[2].target, "_blank");
});

test("the logo is drawn inline, so no site has to serve it", () => {
  const p = mount('<xfina-header site="data"></xfina-header>');
  const svg = shadow(p, "xfina-header").querySelector(".logo svg");
  assert.ok(svg.querySelector("linearGradient#xGrad"));
});

test("the version is stamped from package.json", async () => {
  const { readFileSync } = await import("node:fs");
  const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const p = mount("");
  assert.equal(p.window.XfinaUI.VERSION, version);
});

test("the author's link is labelled Building Wealth in the header and footer", () => {
  const p = mount('<xfina-header site="data"></xfina-header><xfina-footer site="data"></xfina-footer>');
  for (const element of ["xfina-header", "xfina-footer"]) {
    const link = [...shadow(p, element).querySelectorAll("a")].find((a) => a.textContent === "Building Wealth");
    assert.ok(link, element);
    assert.equal(link.href, "https://sakthipriyan.com/building-wealth");
    assert.equal(link.target, "_blank");
  }
});
