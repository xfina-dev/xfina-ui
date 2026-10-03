// A page in jsdom with the theme script run the way xfina-ui/vite runs it:
// inline, at the top of <head>.

import { readFileSync } from "node:fs";
import { JSDOM, CookieJar } from "jsdom";

const themeScript = readFileSync(new URL("../src/theme-script.js", import.meta.url), "utf8");

export function page({ url = "https://data.xfina.dev/", body = "", osDark = false, cookieJar = new CookieJar() } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${body}</body></html>`, {
    url,
    cookieJar,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const listeners = [];
  const media = { matches: osDark, addEventListener: (_, listener) => listeners.push(listener) };
  window.matchMedia = () => media;
  // jsdom has no modal dialogs; record the call instead.
  window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  window.errors = [];
  window.console.error = (message) => window.errors.push(message);
  return {
    window,
    cookieJar,
    theme: () => window.eval(themeScript),
    setOsDark(dark) {
      media.matches = dark;
      for (const listener of listeners) listener();
    },
  };
}
