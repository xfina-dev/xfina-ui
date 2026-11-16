// Drawing SeriesExplorer with ECharts: the chart, the calendar and the period
// slider. What is drawn comes from series.js; how it looks comes from
// xfina-ui's chart theme, so these charts match every other xfina.dev chart in
// both modes. Colours are read at draw time, and the page redraws on
// `themechange`.

import * as theme from "@/chart.js";
import {
  MONTHS,
  axisName,
  cellText,
  divergingBound,
  escape,
  formatChange,
  periodRows,
  stamp,
} from "./series.js";

const valuesFor = (derived, mode) => (mode === "change" ? derived.change : mode === "yoy" ? derived.yoy : derived.level);

// Every value of the row, as its source wrote it, then the computed one, then
// anything that happened that period (a dividend, a split).
function tooltip(ctx, index) {
  const { rows, derived, state, events } = ctx;
  const key = rows.keys[index];
  const parts = derived.lines.map((l, k) => `${escape(l.label)}: <b>${escape(rows.text[k][index])}</b>`);
  if (state.mode !== "level") {
    const v = valuesFor(derived, state.mode)[0][index];
    const what = state.mode === "yoy" ? "on a year earlier" : index > 0 ? `since ${rows.keys[index - 1]}` : "";
    parts.push(v == null ? "No earlier value to compare" : `Change ${escape(what)}: <b>${formatChange(v, derived.points)}</b>`);
  }
  for (const event of events.get(key) ?? []) parts.push(escape(event.label));
  return `<div>${escape(key)}</div>${parts.join("<br>")}`;
}

export function renderChart(plot, ctx) {
  const { rows, derived, state, monthly, unit, events } = ctx;
  const [lo, hi] = periodRows(rows.time, state.from, state.to);
  const t = theme.echarts();
  const line = theme.colour("--border");
  const muted = theme.colour("--muted-foreground");
  // Only the period's rows are drawn, so the y-axis fits the period rather
  // than the whole history.
  const slice = (series) => rows.time.slice(lo, hi + 1).map((time, j) => [time, series[lo + j]]);

  let series;
  if (state.mode === "change") {
    // Change as bars in the calendar's colours, red for a rise and blue for a
    // fall, so the two views read the same way.
    const div = theme.ramp("div");
    series = [
      {
        name: `${derived.lines[0].label} change`,
        type: "bar",
        barMaxWidth: 8,
        data: slice(derived.change[0]).map(([time, v]) => ({
          value: [time, v],
          itemStyle: { color: v == null ? line : v >= 0 ? div[4] : div[0] },
        })),
      },
    ];
  } else {
    series = derived.lines.map((l, k) => ({
      name: l.label,
      type: "line",
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2 },
      itemStyle: { color: t.color[k] },
      emphasis: { focus: "series" },
      data: slice(valuesFor(derived, state.mode)[k]),
    }));
  }

  // Events are dashed rules, without labels: a decade of dividends labelled
  // would cover the series they belong to. Each one's words are in the
  // tooltip of the row it falls on.
  const marks = [...events.values()].flat().filter((e) => e.at >= state.from && e.at <= state.to);
  if (marks.length) {
    series[0] = {
      ...series[0],
      markLine: {
        silent: true,
        symbol: "none",
        label: { show: false },
        lineStyle: { color: muted, type: "dashed", width: 1, opacity: 0.7 },
        data: marks.map((e) => ({ xAxis: e.at })),
      },
    };
  }

  plot.setOption(
    {
      animation: false,
      textStyle: t.textStyle,
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      legend: series.length > 1 ? { ...t.legend, top: 0, right: 0 } : { show: false },
      tooltip: {
        ...t.tooltip,
        trigger: "axis",
        axisPointer: { type: "line", ...t.tooltip.axisPointer },
        formatter: (points) => (points.length ? tooltip(ctx, lo + points[0].dataIndex) : ""),
      },
      xAxis: {
        ...t.axis,
        type: "time",
        min: state.from,
        max: state.to,
        axisLabel: { ...t.axis.axisLabel, hideOverlap: true },
        splitLine: { show: false },
      },
      yAxis: {
        ...t.axis,
        type: "value",
        scale: state.mode === "level",
        name: axisName(state.mode, unit, monthly, derived.points),
        nameLocation: "end",
        nameTextStyle: { ...t.axis.nameTextStyle, align: "left" },
        axisLabel: { ...t.axis.axisLabel, formatter: state.mode === "level" ? undefined : derived.points ? "{value} pp" : "{value}%" },
      },
      series,
    },
    true,
  );
}

export function renderCalendar(plot, ctx) {
  const { rows, derived, state, monthly } = ctx;
  const coloured = valuesFor(derived, state.mode)[0];
  const diverging = state.mode !== "level";
  const [lo, hi] = periodRows(rows.time, state.from, state.to);
  const inPeriod = (i) => i >= lo && i <= hi;
  // Level scales to the period, so movement within it shows; a change scales
  // to the whole series, so a calm stretch looks calm.
  const shown = coloured.slice(lo, hi + 1).filter((v) => v != null);
  const bound = divergingBound(coloured);
  const range = diverging ? [-bound, bound] : shown.length ? [Math.min(...shown), Math.max(...shown)] : [0, 1];
  const t = theme.echarts();
  const colours = {
    muted: theme.colour("--muted-foreground"),
    line: theme.colour("--border"),
    background: theme.colour("--background"),
  };

  const base = {
    animation: false,
    textStyle: t.textStyle,
    tooltip: {
      ...t.tooltip,
      formatter: (p) => {
        const data = Array.isArray(p.data) ? p.data : p.data.value;
        return tooltip(ctx, data[data.length - 1]);
      },
    },
    visualMap: {
      type: "continuous",
      seriesIndex: [0, 1],
      dimension: monthly ? 2 : 1,
      min: range[0],
      max: range[1],
      calculable: false,
      orient: "horizontal",
      left: monthly ? 52 : 56,
      bottom: 0,
      itemHeight: 160,
      inRange: { color: theme.ramp(diverging ? "div" : "seq") },
      text: diverging ? ["rose", "fell"] : ["high", "low"],
      textStyle: { color: colours.muted },
      formatter: (v) => (diverging ? formatChange(v, derived.points) : v.toFixed(2)),
    },
  };

  if (monthly) renderMonthGrid(plot, ctx, base, coloured, inPeriod, range, diverging, colours);
  else renderDecade(plot, ctx, base, coloured, inPeriod, colours);
}

const yearOf = (time) => new Date(time).getUTCFullYear();

// The scale that colours the cells, and beside it a second, hidden one that
// paints the rows with nothing to show in the border's grey. A heatmap with
// no visual map of its own is an error in ECharts' development build, so the
// grey cells get a map that maps everything to the one colour, rather than
// being left out of the coloured one.
const visualMapFor = (base, dimension, seriesIndex, grey, line) => [
  { ...base.visualMap, dimension, seriesIndex },
  { type: "continuous", show: false, seriesIndex: grey, dimension, min: 0, max: 1, inRange: { color: [line, line] } },
];

// A daily series as GitHub draws contributions: one strip per year the period
// touches, newest on top, at most a decade of them, ending where the period
// ends. Cells are sized to fill the width, as the chart does. Days in those
// years but outside the period are faded rather than hidden, so the period
// reads in context.
function renderDecade(plot, ctx, base, coloured, inPeriod, { muted, line, background }) {
  const { rows, state } = ctx;
  const endYear = yearOf(state.to);
  const startYear = Math.max(yearOf(state.from), endYear - 9, yearOf(rows.time[0]));
  const years = [];
  for (let y = endYear; y >= startYear; y -= 1) years.push(y);

  const left = 56;
  const gap = 10;
  const monthRow = 24;
  const width = Math.max(plot.getDom().clientWidth, 640);
  const cell = Math.max(8, Math.min(20, Math.floor((width - left - 8) / 54)));
  const strip = 7 * cell;

  const calendars = years.map((year, k) => ({
    // No `right`: given both edges, ECharts stretches cells into bars.
    top: monthRow + k * (strip + gap),
    left,
    range: String(year),
    cellSize: [cell, cell],
    splitLine: { lineStyle: { color: muted, width: 1, opacity: 0.4 } },
    // A day with no value is an outline on the page background, so it can
    // never be read as the grey of "no change".
    itemStyle: { color: background, borderColor: line, borderWidth: 1 },
    yearLabel: { show: true, position: "left", margin: 28, color: muted, fontSize: 12 },
    monthLabel: { show: k === 0, color: muted, nameMap: "en" },
    dayLabel: { color: muted, firstDay: 1, fontSize: 9, nameMap: ["", "M", "", "W", "", "F", ""] },
  }));

  // Per year, three series: coloured in the period, coloured but faded outside
  // it, and grey for a row with nothing to change from.
  const series = [];
  years.forEach((year, k) => {
    const buckets = [[], [], []];
    rows.keys.forEach((key, i) => {
      if (Number(key.slice(0, 4)) !== year) return;
      const v = coloured[i];
      buckets[v == null ? 2 : inPeriod(i) ? 0 : 1].push([key, v == null ? 0 : v, i]);
    });
    buckets.forEach((data, b) =>
      series.push({
        type: "heatmap",
        coordinateSystem: "calendar",
        calendarIndex: k,
        data,
        itemStyle:
          b === 2
            ? { color: line, borderColor: background, borderWidth: 1 }
            : { borderColor: background, borderWidth: 1, opacity: b === 1 ? 0.25 : 1 },
      }),
    );
  });
  const visualMap = visualMapFor(
    base,
    1,
    series.map((_, i) => i).filter((i) => i % 3 !== 2),
    series.map((_, i) => i).filter((i) => i % 3 === 2),
    line,
  );

  plot.getDom().style.height = `${monthRow + years.length * strip + (years.length - 1) * gap + 56}px`;
  plot.resize();
  plot.setOption({ ...base, visualMap, calendar: calendars, series }, true);
}

// A monthly series: a row per year in the period, newest on top, twelve months
// across, each cell its own value.
function renderMonthGrid(plot, ctx, base, coloured, inPeriod, range, diverging, { muted, line, background }) {
  const { rows, state, dark } = ctx;
  const years = [];
  for (let y = yearOf(state.to); y >= yearOf(state.from); y -= 1) years.push(String(y));
  const compact = years.length > 20;
  // Label ink: near-white or near-black, whichever reads on the cell. The
  // ramps run light-to-dark in light mode and dark-to-light in dark mode, so
  // a strong cell is dark in one and light in the other.
  const foreground = theme.colour("--foreground");
  const pageBackground = theme.colour("--background");
  const lightInk = dark ? foreground : pageBackground;
  const darkInk = dark ? pageBackground : foreground;
  const labelInk = (v) => {
    const t = Math.max(0, Math.min(1, (v - range[0]) / (range[1] - range[0] || 1)));
    const strong = (diverging ? Math.abs(2 * t - 1) : t) > 0.6;
    return strong !== dark ? lightInk : darkInk;
  };
  const buckets = [[], [], []];
  rows.keys.forEach((key, i) => {
    const [y, m] = key.split("-");
    const row = years.indexOf(y);
    if (row < 0) return;
    const v = coloured[i];
    buckets[v == null ? 2 : inPeriod(i) ? 0 : 1].push({
      value: [Number(m) - 1, row, v == null ? 0 : v, i],
      label: { color: v == null ? foreground : labelInk(v) },
    });
  });
  const label = {
    show: true,
    fontSize: compact ? 10 : 11,
    formatter: (p) => cellText(rows.text[0][p.data.value[3]]),
  };
  const series = buckets.map((data, b) => ({
    type: "heatmap",
    data,
    label,
    itemStyle:
      b === 2
        ? { color: line, borderColor: background, borderWidth: 2 }
        : { borderColor: background, borderWidth: 2, opacity: b === 1 ? 0.25 : 1 },
  }));

  plot.getDom().style.height = `${(compact ? 22 : 30) * years.length + 96}px`;
  plot.resize();
  plot.setOption(
    {
      ...base,
      visualMap: visualMapFor(base, 2, [0, 1], [2], line),
      grid: { top: 24, left: 52, right: 8, bottom: 64 },
      xAxis: {
        type: "category",
        data: MONTHS,
        position: "top",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: muted },
      },
      // Category axes run bottom-up; inverted, the newest year is on top.
      yAxis: {
        type: "category",
        data: years,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: muted },
      },
      series,
    },
    true,
  );
}

// A slim overview of the whole series with a slider over it: the same control
// under the chart, the calendar and the table.
export function renderNavigator(plot, ctx) {
  const { rows, derived, state, monthly } = ctx;
  plot.setOption(
    {
      animation: false,
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: "time", min: rows.time[0], max: rows.time.at(-1), show: false },
      yAxis: { type: "value", scale: true, show: false },
      series: [
        {
          type: "line",
          showSymbol: false,
          silent: true,
          lineStyle: { opacity: 0 },
          data: rows.time.map((time, i) => [time, derived.level[0][i]]),
        },
      ],
      dataZoom: [
        {
          type: "slider",
          xAxisIndex: 0,
          startValue: state.from,
          endValue: state.to,
          left: 8,
          right: 8,
          top: 4,
          bottom: 4,
          brushSelect: false,
          borderColor: theme.colour("--border"),
          textStyle: { color: theme.colour("--muted-foreground") },
          labelFormatter: (v) => stamp(v, monthly),
        },
      ],
    },
    true,
  );
}
