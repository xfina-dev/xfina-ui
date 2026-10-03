// The chart helpers, in a page.

import { expect, test } from "vitest";
import * as chart from "@/chart.js";

test("refuse a page without the token stylesheet", () => {
  expect(() => chart.colour("--chart-1")).toThrow(/--chart-1 is not defined; is xfina-ui\/style.css imported\?/);
});

test("resolve a token to a colour a chart library can parse", () => {
  document.documentElement.style.setProperty("--chart-1", "212.8 67.7% 50.2%");
  // jsdom does not compute var() inside hsl(), so this checks the token is
  // found and read; the browser check in the demo covers the resolved value.
  expect(() => chart.colour("--chart-1")).not.toThrow();
});
