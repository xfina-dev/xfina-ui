// @vitest-environment node
// SeriesExplorer rendered as vite-ssg renders data.xfina.dev's pages: in Node,
// with no window, location or ECharts. A static page carries its controls, and
// the data is fetched and drawn in the browser.

import { expect, test } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { SeriesExplorer } from "@/series-explorer.js";

test("SeriesExplorer renders its controls on the server, from the bounds it is given", async () => {
  expect(typeof window).toBe("undefined");
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(SeriesExplorer, {
          // A loader that is never called: the server does not fetch.
          loader: () => Promise.reject(new Error("the server does not fetch")),
          lines: [{ key: "value", label: "USD/INR" }],
          first: "1973-01-02",
          last: "2026-09-29",
          label: "BIS USD/INR",
          syncUrl: true,
        }),
    }),
  );
  expect(html).toContain('aria-label="View"');
  expect(html).toContain(">1Y<");
  expect(html).toContain(">10Y<");
  expect(html).toContain(">All<");
  // The five-year default of a long daily series, and the series' own bounds.
  expect(html).toContain('value="2021-09-29"');
  expect(html).toContain('min="1973-01-02"');
  expect(html).toContain('max="2026-09-29"');
  // Nothing is drawn and nothing is summarised until the rows are in: the
  // period's chips are the one part of the page the server cannot render.
  expect(html).not.toContain("aria-live");
  expect(html).toContain("computed in your browser");
});
