// SeriesExplorer in a page: the controls it offers, the summary it shows, the
// table's rows, and what it refuses to draw. ECharts is stubbed (jsdom has no
// canvas), so what the plots are given is checked rather than the pixels; the
// demo covers the drawing in a browser.

import { beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { SeriesExplorer } from "@/series-explorer.js";

const plots = [];
vi.mock("@/components/ui/series-explorer/echarts.js", () => {
  const init = () => {
    const plot = {
      options: [],
      setOption(option) {
        this.options.push(option);
      },
      getOption: () => ({ dataZoom: [{ start: 0, end: 100 }] }),
      getDom: () => ({ clientWidth: 900, style: {} }),
      resize: () => {},
      dispose: () => {},
      on: () => {},
    };
    plots.push(plot);
    return plot;
  };
  return { default: { init } };
});

// Every token the chart theme reads, so `chart.colour()` finds them; jsdom
// does not resolve var() inside hsl(), and the values are not what is checked.
const TOKENS = [
  "foreground",
  "muted-foreground",
  "border",
  "background",
  "popover",
  "popover-foreground",
  ...Array.from({ length: 16 }, (_, i) => `chart-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `seq-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `div-${i + 1}`),
];

const DAY = 864e5;
const start = Date.UTC(2020, 0, 1);
// Six years of daily rows, so the presets, the slider and paging all have
// something to work on.
const time = Array.from({ length: 6 * 365 }, (_, i) => start + i * DAY);
const close = time.map((_, i) => 100 + i * 0.05);
const lines = [{ key: "close", label: "Close" }];
const rows = { time, values: { close } };

const explorer = (props = {}) =>
  mount(SeriesExplorer, { props: { rows, lines, label: "USD/INR", ...props }, attachTo: document.body });

beforeEach(() => {
  plots.length = 0;
  for (const token of TOKENS) document.documentElement.style.setProperty(`--${token}`, "0 0% 50%");
  window.xfinaTheme = { isDark: () => false };
  window.requestAnimationFrame = (fn) => fn();
});

describe("the controls", () => {
  test("a view switch, the values, the presets the series is long enough for, and the dates", async () => {
    const wrapper = explorer();
    await flushPromises();
    const groups = wrapper.findAll("[role='group']").map((g) => g.attributes("aria-label"));
    expect(groups).toContain("View");
    expect(groups).toContain("Values");
    expect(groups).toContain("Period");
    const labelled = (name) => wrapper.findAll(`[aria-label='${name}'] button`).map((b) => b.text());
    expect(labelled("View")).toEqual(["Chart", "Calendar"]);
    // No YoY unless the series offers it; 1Y and 5Y but no 10Y on six years.
    expect(labelled("Values")).toEqual(["Level", "Change"]);
    expect(labelled("Period")).toEqual(["1Y", "5Y", "All"]);
    expect(wrapper.findAll("input[type='date']").map((i) => i.element.value)).toEqual(["2020-12-29", "2025-12-29"]);
    expect(wrapper.find("[aria-label='Values'] button[aria-pressed='true']").text()).toBe("Level");
  });

  test("YoY is offered only when the site says the series has it", async () => {
    const wrapper = explorer({ yearOnYear: true });
    await flushPromises();
    expect(wrapper.findAll("[aria-label='Values'] button").map((b) => b.text())).toEqual(["Level", "Change", "YoY"]);
  });

  test("a preset sets the period, and a date makes it custom", async () => {
    const wrapper = explorer();
    await flushPromises();
    await wrapper.findAll("[aria-label='Period'] button")[0].trigger("click");
    expect(wrapper.find("input[type='date']").element.value).toBe("2024-12-29");
    await wrapper.find("input[type='date']").setValue("2022-06-01");
    expect(wrapper.find("[aria-label='Period'] button[aria-pressed='true']").exists()).toBe(false);
    expect(wrapper.text()).toContain("2022-06-01 → ");
  });
});

describe("the period's summary", () => {
  test("the period's rows, its change, and a CAGR for a level", async () => {
    const wrapper = explorer();
    await flushPromises();
    // The default period on six years of daily rows is the last five.
    expect(wrapper.text()).toContain("2020-12-29 → 2025-12-29");
    expect(wrapper.text()).toContain("5.0 years");
    expect(wrapper.text()).toContain("1827 rows");
    expect(wrapper.text()).toContain("CAGR");
  });

  test("a series measured in points changes in points and has no CAGR", async () => {
    const wrapper = explorer({ change: "points", lines: [{ key: "close", label: "Policy rate" }] });
    await flushPromises();
    expect(wrapper.text()).toContain("pp");
    expect(wrapper.text()).not.toContain("CAGR");
    expect(wrapper.text()).toContain("in percentage points");
  });
});

describe("the table", () => {
  test("the period's rows, newest first, a page at a time", async () => {
    const wrapper = explorer({ views: ["table"], pageSize: 25 });
    await flushPromises();
    // One view needs no switch.
    expect(wrapper.findAll("[aria-label='View']")).toHaveLength(0);
    const first = wrapper.findAll("tbody tr");
    expect(first).toHaveLength(25);
    expect(first[0].text()).toContain("2025-12-29");
    expect(wrapper.text()).toContain("1–25 of 1827 rows, newest first");
    await wrapper.findAll("button").find((b) => b.text() === "Older").trigger("click");
    expect(wrapper.findAll("tbody tr")[0].text()).toContain("2025-12-04");
    expect(wrapper.text()).toContain("26–50 of 1827");
  });

  test("a change column and an events column, when there is something in them", async () => {
    const wrapper = explorer({
      views: ["table"],
      events: [{ time: "2025-12-29", label: "Dividend 0.25" }],
    });
    await flushPromises();
    expect(wrapper.findAll("thead th").map((h) => h.text())).toEqual(["Date", "Close", "Events"]);
    expect(wrapper.findAll("tbody tr")[0].text()).toContain("Dividend 0.25");
    await wrapper.findAll("[aria-label='Values'] button")[1].trigger("click");
    expect(wrapper.findAll("thead th").map((h) => h.text())).toEqual(["Date", "Close", "Change", "Events"]);
  });
});

describe("the data it is given", () => {
  test("a loader's rows, and a loader that fails says so instead of drawing", async () => {
    const wrapper = explorer({ rows: undefined, loader: () => Promise.resolve(rows) });
    await flushPromises();
    expect(wrapper.text()).toContain("2020-12-29 → 2025-12-29");

    const failed = explorer({ rows: undefined, loader: () => Promise.reject(new Error("HTTP 404")) });
    await flushPromises();
    expect(failed.find("[role='status']").text()).toBe("Could not load USD/INR: HTTP 404");
  });

  test("new rows reopen the period on the new series", async () => {
    const wrapper = explorer();
    await flushPromises();
    const short = { time: time.slice(0, 200), values: { close: close.slice(0, 200) } };
    await wrapper.setProps({ rows: short });
    await flushPromises();
    expect(wrapper.findAll("[aria-label='Period'] button").map((b) => b.text())).toEqual(["All"]);
    expect(wrapper.text()).toContain("2020-01-01 → 2020-07-18");
  });

  test("bounds a site knows up front put the controls in the first render", async () => {
    const wrapper = mount(SeriesExplorer, {
      props: { loader: () => new Promise(() => {}), lines, first: "2020-01-01", last: "2025-12-29" },
    });
    // Before anything has loaded: a static page's controls are in its HTML.
    expect(wrapper.findAll("[aria-label='Period'] button").map((b) => b.text())).toEqual(["1Y", "5Y", "All"]);
    expect(wrapper.findAll("input[type='date']").map((i) => i.element.value)).toEqual(["2020-12-29", "2025-12-29"]);
    await flushPromises();
    expect(wrapper.find("[role='status']").text()).toBe("Loading…");
  });
});

describe("what it refuses", () => {
  const bad = (props) => () => mount(SeriesExplorer, { props: { lines, ...props } });

  test("neither rows nor a loader, both, and an unknown frequency, change or view", () => {
    expect(bad({})).toThrow(/either `rows` or `loader`/);
    expect(bad({ rows, loader: () => rows })).toThrow(/either `rows` or `loader`/);
    expect(bad({ rows, frequency: "weekly" })).toThrow(/frequency "weekly" is not daily or monthly/);
    expect(bad({ rows, change: "ratio" })).toThrow(/change "ratio" is not percent or points/);
    expect(bad({ rows, views: ["sparkline"] })).toThrow(/view "sparkline" is not one of chart, calendar, table/);
    expect(bad({ rows, lines: [] })).toThrow(/at least one line/);
  });

  test("a page with no theme script, rather than a chart in the wrong mode's colours", async () => {
    delete window.xfinaTheme;
    const errors = [];
    const wrapper = mount(SeriesExplorer, {
      props: { rows, lines },
      global: { config: { errorHandler: (error) => errors.push(error) } },
    });
    await flushPromises();
    expect(errors.map((e) => e.message).join(" ")).toMatch(/needs the theme script in <head>/);
    wrapper.unmount();
  });
});

test("the chart, the calendar and the slider are drawn with the theme, and redrawn on themechange", async () => {
  const wrapper = explorer();
  await flushPromises();
  const [chart, , navigator] = plots;
  expect(plots).toHaveLength(3);
  // The chart draws only the period's rows, and the slider the whole series.
  expect(chart.options.at(-1).series[0].data).toHaveLength(1827);
  expect(chart.options.at(-1).series[0].name).toBe("Close");
  expect(navigator.options.at(-1).series[0].data).toHaveLength(time.length);
  expect(navigator.options.at(-1).dataZoom[0].type).toBe("slider");

  const drawn = chart.options.length;
  window.dispatchEvent(new window.Event("themechange"));
  await flushPromises();
  expect(chart.options.length).toBeGreaterThan(drawn);
  wrapper.unmount();
});
