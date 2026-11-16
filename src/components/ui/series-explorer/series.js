// SeriesExplorer's arithmetic, apart from any drawing: the rows a site hands
// in, their changes, the period presets, the period's summary, and the address
// that records what is on screen. Pure functions, so they are tested without a
// browser, and the numbers a reader sees are the numbers the tests check.
//
// The component never fetches anything: a site passes its own rows, parsed
// from whatever it holds (a published CSV, a parsed statement, a series in
// WASM). Each value computed here (a change, a CAGR) is labelled as computed
// on the page. Tooltips, the table and calendar cells show each value's own
// text, so a value reads exactly as its source wrote it (90.50 stays 90.50).

export const DAY = 864e5;
export const YEAR = 365.2425 * DAY;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// `YYYY-MM-DD` or `YYYY-MM` as a UTC time; a month counts from its first day.
export function toTime(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return Date.UTC(y, m - 1, d || 1);
}

// A bound a site gives as a day (`2024-01-31`), a month (`2024-01`) or a time.
export function asTime(value) {
  return typeof value === "number" ? value : toTime(value);
}

// A site's `{ time, values, text }` as the rows the explorer draws: one row
// per time, each line's numbers, and each line's own text.
//
// `values` (and `text`) is either an array per line, in `lines` order, or an
// object keyed by each line's `key`, so a caller can pass columns it already
// holds by name. A line with no column is an error, not an empty line: an
// explorer drawing nothing looks the same as a series that is flat.
export function rowsFrom(input, lines, monthly) {
  const time = input?.time;
  if (!Array.isArray(time) || time.length === 0) {
    throw new Error("xfina-ui: SeriesExplorer needs rows with a non-empty `time` array of epoch milliseconds");
  }
  const column = (source, line, k) => (Array.isArray(source) ? source[k] : source?.[line.key]);
  const values = lines.map((line, k) => {
    const given = column(input.values, line, k);
    if (!given) {
      throw new Error(`xfina-ui: SeriesExplorer has no values for line ${line.key ?? k} (${line.label})`);
    }
    if (given.length !== time.length) {
      throw new Error(
        `xfina-ui: SeriesExplorer's line ${line.key ?? k} has ${given.length} values for ${time.length} times`,
      );
    }
    return Array.from(given, (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v)));
  });
  const text = lines.map((line, k) => {
    const given = column(input.text, line, k);
    return given ? Array.from(given, String) : values[k].map((v) => (v == null ? "—" : String(v)));
  });
  return { time, keys: time.map((t) => stamp(t, monthly)), values, text };
}

// A CSV's text as rows, for a site whose source is a CSV. The first column is
// the period; each line names the column it reads. Values keep their published
// text. Written for the CSVs xfina-data publishes, which never quote a field,
// so splitting on commas is the whole parser.
export function rowsFromCsv(text, lines) {
  const [header, ...body] = String(text).trim().split("\n");
  const columns = header.split(",");
  const keyed = body.map((line) => line.split(","));
  const at = lines.map((line) => {
    const index = columns.indexOf(line.key);
    if (index < 0) throw new Error(`xfina-ui: column ${line.key} is not in the CSV (${columns.join(", ")})`);
    return index;
  });
  return {
    time: keyed.map((r) => toTime(r[0])),
    values: at.map((index) => keyed.map((r) => Number(r[index]))),
    text: at.map((index) => keyed.map((r) => r[index])),
  };
}

// How a change between two values is measured. A price or an index changes by
// a percentage of itself. A series that is itself a percentage, such as a
// policy rate (`change="points"`), changes by the difference: 6.50 to 5.25 is
// -1.25 points, and calling it -19.23% would read as a return, which a rate
// is not.
function changeBetween(points) {
  return points ? (b, a) => b - a : (b, a) => (b / a - 1) * 100;
}

// Each drawn line's values, its change on the previous row, and its change on
// the same period a year earlier.
export function derive(rows, lines, change, monthly) {
  const points = change === "points";
  const delta = changeBetween(points);
  const level = rows.values;
  // The previous row for a daily series, the previous month for a monthly one
  // (which has no gaps).
  const changes = level.map((series) =>
    series.map((v, i) => (i === 0 || v == null || series[i - 1] == null ? null : delta(v, series[i - 1]))),
  );
  return { lines, level, change: changes, yoy: level.map((series) => yearOnYear(rows, series, delta, monthly)), points };
}

// A year earlier is the same month for a monthly series, and for a daily one
// the last row on or before the same date a year back, within a week of it: a
// year earlier often falls on a weekend or a holiday, and comparing with
// nothing at all would leave the line empty rather than slightly offset.
function yearOnYear(rows, series, delta, monthly) {
  if (monthly) {
    const byKey = new Map(rows.keys.map((key, i) => [key, series[i]]));
    return rows.keys.map((key, i) => {
      const before = byKey.get(String(Number(key.slice(0, 4)) - 1) + key.slice(4));
      return before == null || series[i] == null ? null : delta(series[i], before);
    });
  }
  const { time } = rows;
  let j = 0;
  return time.map((t, i) => {
    const day = new Date(t);
    const target = Date.UTC(day.getUTCFullYear() - 1, day.getUTCMonth(), day.getUTCDate());
    while (j + 1 < time.length && time[j + 1] <= target) j += 1;
    const usable = time[j] <= target && target - time[j] <= 7 * DAY && series[j] != null && series[i] != null;
    return usable ? delta(series[i], series[j]) : null;
  });
}

export function modes(yoy) {
  return [["level", "Level"], ["change", "Change"], ...(yoy ? [["yoy", "YoY"]] : [])];
}

// A preset is offered only when the series is longer than it: a 10Y button on
// six years of data would just mean All.
export function ranges(first, last) {
  const span = (last - first) / YEAR;
  return [1, 5, 10]
    .filter((n) => span > n)
    .map((n) => [String(n), `${n}Y`])
    .concat([["0", "All"]]);
}

// Five years of a long daily series opens readably; anything else opens whole.
export function defaultPreset(first, last, monthly) {
  return !monthly && (last - first) / YEAR > 5 ? 5 : 0;
}

export function presetPeriod(years, first, last) {
  if (!years) return { preset: 0, from: first, to: last };
  const end = new Date(last);
  const from = Math.max(first, Date.UTC(end.getUTCFullYear() - years, end.getUTCMonth(), end.getUTCDate()));
  return { preset: years, from, to: last };
}

// A custom period from two days, in either order, kept inside the series. A
// monthly series counts a month from its first day, so a start date in
// mid-March still includes March.
export function customPeriod(from, to, first, last, monthly) {
  if (from > to) [from, to] = [to, from];
  if (monthly) {
    const start = new Date(from);
    from = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1);
  }
  const clampedFrom = Math.max(first, Math.min(from, last));
  return { preset: null, from: clampedFrom, to: Math.max(clampedFrom, Math.min(to, last)) };
}

// The index range of rows inside a period; lo > hi when none are.
export function periodRows(time, from, to) {
  let lo = 0;
  while (lo < time.length && time[lo] < from) lo += 1;
  let hi = time.length - 1;
  while (hi >= 0 && time[hi] > to) hi -= 1;
  return [lo, hi];
}

// The period's own summary: each line's first and last value in it, the change
// between them, and that change as a compound annual rate, annualised pro rata
// over whatever span is chosen, a few weeks included. A period with no length
// (a single row) has no rate, and nor does a change in points: compounding a
// rate's difference means nothing.
export function summary(rows, derived, lo, hi) {
  if (lo > hi) return null;
  const years = (rows.time[hi] - rows.time[lo]) / YEAR;
  const span = years >= 1 ? `${years.toFixed(1)} years` : `${Math.round(years * 365.2425)} days`;
  return {
    text: `${rows.keys[lo]} → ${rows.keys[hi]} · ${span} · ${hi - lo + 1} rows`,
    stats: derived.lines.map((line, k) => {
      const a = derived.level[k][lo];
      const b = derived.level[k][hi];
      const known = a != null && b != null;
      return {
        label: line.label,
        from: rows.text[k][lo],
        to: rows.text[k][hi],
        change: known ? formatChange(changeBetween(derived.points)(b, a), derived.points) : "—",
        cagr: derived.points || !known ? null : years > 0 ? `${percent((Math.pow(b / a, 1 / years) - 1) * 100)} a year` : "—",
      };
    }),
  };
}

// The address carries what is on screen, so a view can be shared and the same
// period opened on another series to compare them exactly:
// ?from=2024-01-01&to=2024-12-31, or ?period=1y, plus view and mode. A site
// that holds its data in the browser (a parsed file nobody else can open from
// a link) leaves `sync-url` off and none of this runs.
export function readQuery(search, { views, modes: modeList, ranges: rangeList, first, last, monthly }) {
  const q = new URLSearchParams(search);
  const out = {};
  if (views.includes(q.get("view"))) out.view = q.get("view");
  if (modeList.some(([m]) => m === q.get("mode"))) out.mode = q.get("mode");
  const period = (q.get("period") || "").toLowerCase();
  const preset = period === "all" ? 0 : parseInt(period, 10);
  if (period && rangeList.some(([n]) => Number(n) === preset)) Object.assign(out, presetPeriod(preset, first, last));
  const from = parseDay(q.get("from"));
  const to = parseDay(q.get("to"));
  if (from != null || to != null) {
    Object.assign(out, customPeriod(from ?? out.from ?? first, to ?? out.to ?? last, first, last, monthly));
  }
  return out;
}

export function writeQuery(state, defaultYears, defaultView = "chart") {
  const q = new URLSearchParams();
  if (state.view !== defaultView) q.set("view", state.view);
  if (state.mode !== "level") q.set("mode", state.mode);
  if (state.preset == null) {
    q.set("from", ymd(state.from));
    q.set("to", ymd(state.to));
  } else if (state.preset !== defaultYears) {
    q.set("period", state.preset ? `${state.preset}y` : "all");
  }
  const query = q.toString();
  return query ? `?${query}` : "";
}

// `YYYY-MM-DD` as a UTC day, or null if it is not one.
export function parseDay(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || "");
  if (!match) return null;
  const t = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(t) ? null : t;
}

export function ymd(t) {
  return new Date(t).toISOString().slice(0, 10);
}

export function stamp(t, monthly) {
  return new Date(t).toISOString().slice(0, monthly ? 7 : 10);
}

export function percent(value) {
  return (value > 0 ? "+" : "") + value.toFixed(2) + "%";
}

// A computed change as the page shows it. Points are rounded to four places,
// which is as many as the BIS prints, so a difference such as 12.06 - 11.83
// reads 0.23 rather than carrying binary noise, and 0.125 stays 0.125.
export function formatChange(value, points) {
  if (!points) return percent(value);
  return (value > 0 ? "+" : "") + String(Number(value.toFixed(4))) + " pp";
}

// A value's text short enough for a calendar cell: digits past the second
// decimal are cut, not rounded, and marked with an ellipsis.
export function cellText(text) {
  const [whole, fraction] = String(text).split(".");
  return fraction && fraction.length > 2 ? `${whole}.${fraction.slice(0, 2)}…` : text;
}

// Diverging scales are symmetric about zero, clipped at the 95th percentile of
// the size of a change, so one outlier does not grey out every other cell; the
// tooltip still has the exact value.
export function divergingBound(series) {
  const sizes = series
    .filter((v) => v != null && Number.isFinite(v))
    .map(Math.abs)
    .sort((a, b) => a - b);
  return sizes.length ? sizes[Math.min(sizes.length - 1, Math.floor(sizes.length * 0.95))] || 1 : 1;
}

export function axisName(mode, unit, monthly, points) {
  if (mode === "level") return unit;
  const what = points ? "Change in percentage points" : "% change";
  if (mode === "yoy") return `${what} on a year earlier`;
  return monthly ? `${what} on the month before` : `${what} on the previous row`;
}

// The events whose time falls on a row's period, keyed by that row's stamp, so
// a dividend or a split shows in the row's tooltip as well as on the chart.
export function eventsByKey(events, monthly) {
  const map = new Map();
  for (const event of events) {
    const key = stamp(asTime(event.time), monthly);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ ...event, at: asTime(event.time) });
  }
  return map;
}

export function escape(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
