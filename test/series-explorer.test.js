// @vitest-environment node
// SeriesExplorer's arithmetic: the rows a site hands in, their changes, the
// periods, the summary a reader sees, and the address a shared view carries.
// The fixtures are the shape of each consumer's data: a published CSV
// (xfina-data), and columns a caller already holds by name (xfina and Labs).

import { describe, expect, test } from "vitest";
import {
  YEAR,
  cellText,
  customPeriod,
  defaultPreset,
  derive,
  divergingBound,
  eventsByKey,
  formatChange,
  modes,
  percent,
  periodRows,
  presetPeriod,
  ranges,
  readQuery,
  rowsFrom,
  rowsFromCsv,
  summary,
  toTime,
  writeQuery,
} from "@/components/ui/series-explorer/series.js";

// A monthly index, as xfina-data publishes one.
const CPI_CSV = `month,index
2024-01,97.70
2024-02,97.90
2024-03,98.30
2025-01,101.20
2025-12,104.10`;
// A policy rate: a series measured in percentage points.
const RATE_CSV = `month,rate
2001-01,8
2001-02,8
2001-03,7
2001-04,8.75
2001-05,8.5`;

const cpiLines = [{ key: "index", label: "CPI" }];
const rateLines = [{ key: "rate", label: "Policy rate" }];
const cpiRows = () => rowsFrom(rowsFromCsv(CPI_CSV, cpiLines), cpiLines, true);
const cpi = () => {
  const rows = cpiRows();
  return { rows, derived: derive(rows, cpiLines, "percent", true) };
};

describe("the rows a site hands in", () => {
  test("a CSV's columns, keeping each value's published text", () => {
    const rows = cpiRows();
    expect(rows.keys[0]).toBe("2024-01");
    expect(rows.time[0]).toBe(Date.UTC(2024, 0, 1));
    expect(rows.values[0][0]).toBe(97.7);
    // 97.70 as published, not 97.7: a value reads as its source wrote it.
    expect(rows.text[0][0]).toBe("97.70");
    expect(toTime("2026-09-29")).toBe(Date.UTC(2026, 8, 29));
  });

  test("columns a caller already holds, by name or in order", () => {
    const lines = [{ key: "close", label: "Close" }, { key: "adjClose", label: "Adj close" }];
    const time = [Date.UTC(2026, 0, 2), Date.UTC(2026, 0, 5)];
    const byName = rowsFrom({ time, values: { close: [101.5, 102], adjClose: [100, 100.5] } }, lines, false);
    const byOrder = rowsFrom({ time, values: [[101.5, 102], [100, 100.5]] }, lines, false);
    expect(byName).toEqual(byOrder);
    expect(byName.keys).toEqual(["2026-01-02", "2026-01-05"]);
    // Without text of its own, a value is shown as the number it is.
    expect(byName.text[0]).toEqual(["101.5", "102"]);
  });

  test("a line with no values, or a column of the wrong length, is an error", () => {
    const lines = [{ key: "close", label: "Close" }];
    const time = [Date.UTC(2026, 0, 2)];
    expect(() => rowsFrom({ time, values: {} }, lines, false)).toThrow(/no values for line close/);
    expect(() => rowsFrom({ time, values: [[1, 2]] }, lines, false)).toThrow(/2 values for 1 times/);
    expect(() => rowsFrom({ time: [], values: [[]] }, lines, false)).toThrow(/non-empty `time`/);
    expect(() => rowsFromCsv(CPI_CSV, [{ key: "value", label: "CPI" }])).toThrow(/column value is not in the CSV/);
  });

  test("a gap in a line is a gap, not a zero", () => {
    const lines = [{ key: "nav", label: "NAV" }];
    const time = [Date.UTC(2026, 0, 2), Date.UTC(2026, 0, 5), Date.UTC(2026, 0, 6)];
    const rows = rowsFrom({ time, values: { nav: [10, null, 12] } }, lines, false);
    expect(rows.values[0]).toEqual([10, null, 12]);
    const { change } = derive(rows, lines, "percent", false);
    expect(change[0]).toEqual([null, null, null]);
  });
});

describe("the changes", () => {
  test("on the previous row, and on a year earlier for a monthly series", () => {
    const { rows, derived } = cpi();
    expect(derived.change[0][0]).toBeNull();
    expect(derived.change[0][1]).toBeCloseTo((97.9 / 97.7 - 1) * 100, 10);
    expect(derived.yoy[0][0]).toBeNull();
    const jan25 = rows.keys.indexOf("2025-01");
    expect(derived.yoy[0][jan25]).toBeCloseTo((101.2 / 97.7 - 1) * 100, 10);
  });

  test("a daily series' year earlier is the last row within a week of the date", () => {
    const lines = [{ key: "close", label: "Close" }];
    // 2025-01-01 has no row; the 2024-12-30 one is six days before it.
    const time = [Date.UTC(2024, 11, 30), Date.UTC(2025, 0, 2), Date.UTC(2026, 0, 1)];
    const rows = rowsFrom({ time, values: { close: [100, 101, 110] } }, lines, false);
    const { yoy } = derive(rows, lines, "percent", false);
    expect(yoy[0][0]).toBeNull();
    expect(yoy[0][2]).toBeCloseTo((110 / 100 - 1) * 100, 10);
  });
});

describe("periods", () => {
  const first = Date.UTC(2020, 0, 6);
  const last = Date.UTC(2026, 9, 3);

  test("presets are offered only when the series is longer than them", () => {
    expect(ranges(first, last).map(([, label]) => label)).toEqual(["1Y", "5Y", "All"]);
    expect(ranges(first, first + 0.5 * YEAR).map(([, label]) => label)).toEqual(["All"]);
  });

  test("a long daily series opens on five years; a monthly one opens whole", () => {
    expect(defaultPreset(first, last, false)).toBe(5);
    expect(defaultPreset(first, last, true)).toBe(0);
    expect(presetPeriod(5, first, last)).toEqual({ preset: 5, from: Date.UTC(2021, 9, 3), to: last });
    expect(presetPeriod(0, first, last)).toEqual({ preset: 0, from: first, to: last });
  });

  test("a custom period is ordered, kept inside the series, and counts whole months", () => {
    expect(customPeriod(last + YEAR, first - YEAR, first, last, false)).toEqual({ preset: null, from: first, to: last });
    expect(customPeriod(Date.UTC(2024, 2, 15), Date.UTC(2024, 5, 1), first, last, true).from).toBe(Date.UTC(2024, 2, 1));
  });

  test("the period's rows, and an empty period", () => {
    const time = [1, 2, 3, 4, 5];
    expect(periodRows(time, 2, 4)).toEqual([1, 3]);
    const [lo, hi] = periodRows(time, 6, 9);
    expect(lo > hi).toBe(true);
  });
});

describe("the summary", () => {
  test("first and last values, the change, and the CAGR, pro rata", () => {
    const { rows, derived } = cpi();
    const s = summary(rows, derived, 0, rows.keys.length - 1);
    expect(s.text).toBe("2024-01 → 2025-12 · 1.9 years · 5 rows");
    const [line] = s.stats;
    expect([line.from, line.to]).toEqual(["97.70", "104.10"]);
    expect(line.change).toBe(percent((104.1 / 97.7 - 1) * 100));
    const years = (Date.UTC(2025, 11, 1) - Date.UTC(2024, 0, 1)) / YEAR;
    expect(line.cagr).toBe(`${percent((Math.pow(104.1 / 97.7, 1 / years) - 1) * 100)} a year`);
  });

  test("a single row has a change but no rate, and an empty period has no summary", () => {
    const { rows, derived } = cpi();
    expect(summary(rows, derived, 3, 3).stats[0].cagr).toBe("—");
    expect(summary(rows, derived, 4, 3)).toBeNull();
  });
});

describe("a rate", () => {
  const rate = () => {
    const rows = rowsFrom(rowsFromCsv(RATE_CSV, rateLines), rateLines, true);
    return { rows, derived: derive(rows, rateLines, "points", true) };
  };

  test("changes by the difference in points, not a percentage of itself", () => {
    const { derived } = rate();
    expect(derived.points).toBe(true);
    // 2001-03 to 2001-04: the bank rate's 7 to the repo rate's 8.75.
    expect(derived.change[0][3]).toBe(1.75);
    expect(formatChange(derived.change[0][3], true)).toBe("+1.75 pp");
  });

  test("has a change in points over a period, and no CAGR", () => {
    const { rows, derived } = rate();
    const [line] = summary(rows, derived, 0, rows.keys.length - 1).stats;
    expect([line.from, line.to]).toEqual(["8", "8.5"]);
    expect(line.change).toBe("+0.5 pp");
    expect(line.cagr).toBeNull();
  });

  test("shows points without binary noise or lost digits", () => {
    expect(formatChange(12.06 - 11.83, true)).toBe("+0.23 pp");
    expect(formatChange(0.125 - 1, true)).toBe("-0.875 pp");
    expect(formatChange(0, true)).toBe("0 pp");
    expect(formatChange(1.234, false)).toBe("+1.23%");
  });
});

describe("the address", () => {
  const first = Date.UTC(1973, 0, 2);
  const last = Date.UTC(2026, 8, 29);
  const ctx = { views: ["chart", "calendar"], modes: modes(false), ranges: ranges(first, last), first, last, monthly: false };

  test("reads a shared view and period, and ignores what it does not know", () => {
    expect(readQuery("?view=calendar&mode=change&period=1y", ctx)).toMatchObject({ view: "calendar", mode: "change", preset: 1 });
    // A mode the series does not offer, and a view this explorer does not show.
    expect(readQuery("?mode=yoy&view=table", ctx)).toEqual({});
    expect(readQuery("?view=table", { ...ctx, views: ["chart", "table"] })).toEqual({ view: "table" });
    expect(readQuery("?from=2024-01-01&to=2024-12-31", ctx)).toEqual({
      preset: null,
      from: Date.UTC(2024, 0, 1),
      to: Date.UTC(2024, 11, 31),
    });
  });

  test("writes only what differs from the page's defaults", () => {
    expect(writeQuery({ view: "chart", mode: "level", preset: 5 }, 5)).toBe("");
    expect(writeQuery({ view: "calendar", mode: "change", preset: 0 }, 5)).toBe("?view=calendar&mode=change&period=all");
    expect(writeQuery({ view: "chart", mode: "level", preset: null, from: Date.UTC(2024, 0, 1), to: Date.UTC(2024, 11, 31) }, 5)).toBe(
      "?from=2024-01-01&to=2024-12-31",
    );
    // An explorer whose first view is the table writes nothing for it.
    expect(writeQuery({ view: "table", mode: "level", preset: 5 }, 5, "table")).toBe("");
  });
});

test("events are keyed by the row they fall on", () => {
  const events = eventsByKey([{ time: "2026-02-10", label: "Dividend 0.25" }, { time: Date.UTC(2026, 1, 10), label: "Split 2:1" }], false);
  expect(events.get("2026-02-10").map((e) => e.label)).toEqual(["Dividend 0.25", "Split 2:1"]);
  expect(events.get("2026-02-10")[0].at).toBe(Date.UTC(2026, 1, 10));
  expect(eventsByKey([{ time: "2026-02-10", label: "Dividend" }], true).get("2026-02")).toHaveLength(1);
});

test("values keep their digits, cut rather than rounded, and one outlier does not flatten a scale", () => {
  expect(cellText("95.985029")).toBe("95.98…");
  expect(cellText("90.50")).toBe("90.50");
  expect(divergingBound([null, 1, -2, 3, -4])).toBe(4);
  expect(percent(0)).toBe("0.00%");
  expect(percent(1.234)).toBe("+1.23%");
});
