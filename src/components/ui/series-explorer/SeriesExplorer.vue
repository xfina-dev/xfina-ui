<script setup>
// A time series browsed as a chart, a calendar or a table.
//
// The views are twins. They share one set of controls (what to show: the level
// or its change; which period, chosen by preset, by date, or by dragging the
// slider under any view) and one summary of that period, CAGR included for a
// level (a rate changes in points and has none). Switching view keeps
// everything else as it was.
//
// The component never fetches anything. A site passes `rows` it already holds,
// or a `loader` that resolves to them: xfina-data a published CSV it fetched,
// xfina a series it parsed from a statement, Labs a series out of WASM or
// IndexedDB. Were a path a prop instead, only a site with a URL could use it,
// which is how this component came to be copied in the first place.
//
// ECharts is imported dynamically, so a page pays for it only once an explorer
// mounts, and a static build never runs it.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { Button } from "../button";
import { Input } from "../input";
import { Segmented } from "../segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import {
  asTime,
  customPeriod,
  defaultPreset,
  derive,
  eventsByKey,
  formatChange,
  modes,
  parseDay,
  periodRows,
  presetPeriod,
  ranges,
  readQuery,
  rowsFrom,
  summary,
  writeQuery,
  ymd,
} from "./series.js";
import { renderCalendar, renderChart, renderNavigator } from "./render.js";

const VIEW_LABELS = { chart: "Chart", calendar: "Calendar", table: "Table" };
const FREQUENCIES = ["daily", "monthly"];
const CHANGES = ["percent", "points"];

const props = defineProps({
  // The data, as rows: `{ time: [epoch ms], values, text }`, where `values`
  // (and the optional `text`, each value as its source wrote it) is an array
  // per line in `lines` order, or an object keyed by each line's `key`.
  rows: { type: Object, default: null },
  // Or a function resolving to those rows, called when the explorer mounts and
  // again whenever it changes. Exactly one of `rows` and `loader` is given.
  loader: { type: Function, default: null },
  lines: { type: Array, required: true },
  frequency: { type: String, default: "daily" },
  unit: { type: String, default: "" },
  change: { type: String, default: "percent" },
  views: { type: Array, default: () => ["chart", "calendar"] },
  yearOnYear: { type: Boolean, default: false },
  events: { type: Array, default: () => [] },
  // The period's bounds, when a site knows them before the rows are in (a
  // static page whose controls are rendered before anything is fetched):
  // `YYYY-MM-DD`, `YYYY-MM`, or epoch ms. Taken from the rows otherwise.
  first: { type: [String, Number], default: null },
  last: { type: [String, Number], default: null },
  syncUrl: { type: Boolean, default: false },
  label: { type: String, default: "Series" },
  note: { type: String, default: "" },
  pageSize: { type: Number, default: 50 },
});

// A prop that is wrong is an error here and not a drawing that looks right:
// an explorer with no data, or one measuring a rate as a percentage of
// itself, reads as a series rather than as a mistake.
if (!props.rows === !props.loader) {
  throw new Error("xfina-ui: SeriesExplorer takes either `rows` or `loader`, not both and not neither");
}
if (!props.lines.length) throw new Error("xfina-ui: SeriesExplorer needs at least one line in `lines`");
if (!FREQUENCIES.includes(props.frequency)) {
  throw new Error(`xfina-ui: SeriesExplorer frequency "${props.frequency}" is not ${FREQUENCIES.join(" or ")}`);
}
if (!CHANGES.includes(props.change)) {
  throw new Error(`xfina-ui: SeriesExplorer change "${props.change}" is not ${CHANGES.join(" or ")}`);
}
for (const view of props.views) {
  if (!VIEW_LABELS[view]) {
    throw new Error(`xfina-ui: SeriesExplorer view "${view}" is not one of ${Object.keys(VIEW_LABELS).join(", ")}`);
  }
}
if (!props.views.length) throw new Error("xfina-ui: SeriesExplorer needs at least one view");

const monthly = props.frequency === "monthly";
const MODES = computed(() => modes(props.yearOnYear));
const VIEWS = computed(() => props.views.map((value) => ({ value, label: VIEW_LABELS[value] })));
const defaultView = props.views[0];

const loaded = shallowRef(null); // { rows, derived } once the data is in
const bounds = ref(null); // { first, last }; from the props, or from the rows
const status = ref("");
const page = ref(0);
const events = computed(() => eventsByKey(props.events, monthly));

const state = reactive({ view: defaultView, mode: "level", preset: 0, from: 0, to: 0 });
const defaultYears = ref(0);
const RANGES = computed(() => (bounds.value ? ranges(bounds.value.first, bounds.value.last) : []));

// The period opens on the default preset for the series' length. A site that
// knows the bounds up front gets its controls in the first render; otherwise
// they appear with the rows.
function setBounds(first, last) {
  bounds.value = { first, last };
  defaultYears.value = defaultPreset(first, last, monthly);
  Object.assign(state, presetPeriod(defaultYears.value, first, last));
}
if (props.first != null && props.last != null) setBounds(asTime(props.first), asTime(props.last));

// ---- Controls --------------------------------------------------------------

const modeModel = computed({ get: () => state.mode, set: (v) => (state.mode = v) });
const viewModel = computed({ get: () => state.view, set: (v) => (state.view = v) });
// No preset is pressed while the period is custom.
const rangeModel = computed({
  get: () => (state.preset == null ? "" : String(state.preset)),
  set: (v) => {
    Object.assign(state, presetPeriod(Number(v), bounds.value.first, bounds.value.last));
    steerNavigator();
  },
});
// Exact start and end days. They follow the presets and the slider, and
// setting either one makes the period custom.
function setDay(which, text) {
  const day = parseDay(text);
  if (day == null) return;
  const next = which === "from" ? [day, state.to] : [state.from, day];
  Object.assign(state, customPeriod(next[0], next[1], bounds.value.first, bounds.value.last, monthly));
  steerNavigator();
}
const fromModel = computed({ get: () => ymd(state.from), set: (v) => setDay("from", v) });
const toModel = computed({ get: () => ymd(state.to), set: (v) => setDay("to", v) });

const period = computed(() => {
  if (!loaded.value) return null;
  const { rows, derived } = loaded.value;
  const [lo, hi] = periodRows(rows.time, state.from, state.to);
  return summary(rows, derived, lo, hi) ?? { text: "No values in this period.", stats: [] };
});

const note = computed(() => {
  const label = props.lines[0].label;
  const computedNote =
    props.change === "points"
      ? "Change, in percentage points, is computed in your browser from the published values; it is not itself published."
      : "Change and CAGR are computed in your browser from the published values; they are not themselves published.";
  const parts = [props.note || computedNote];
  if (state.view === "calendar") {
    parts.push(
      monthly
        ? `Cells show the value of ${label}; their colour follows Values.`
        : `Colour follows ${label}. Empty squares are days with no value: weekends, bank holidays, or days the source did not publish. Faded squares are outside the chosen period. At most a decade is drawn; drag the period back for earlier years.`,
    );
  } else if (state.view === "chart" && state.mode === "change" && props.lines.length > 1) {
    parts.push(`Change is drawn for ${label}.`);
  }
  if (props.events.length && state.view === "chart") {
    parts.push("Dashed rules mark events; each one's words are in the tooltip of the row it falls on.");
  }
  return parts.join(" ");
});

// ---- The table -------------------------------------------------------------

// Every row in the period, newest first, a page at a time: a dozen value
// fields are read, not seen, and this is where someone checks them.
const table = computed(() => {
  if (!loaded.value || state.view !== "table") return null;
  const { rows, derived } = loaded.value;
  const [lo, hi] = periodRows(rows.time, state.from, state.to);
  if (lo > hi) return { total: 0, shown: [], from: 0, to: 0 };
  const total = hi - lo + 1;
  const start = Math.min(page.value * props.pageSize, Math.max(0, total - 1));
  const count = Math.min(props.pageSize, total - start);
  const computedLabel = state.mode === "yoy" ? "YoY" : "Change";
  const shown = Array.from({ length: count }, (_, j) => {
    const i = hi - start - j;
    const value = state.mode === "level" ? null : (state.mode === "yoy" ? derived.yoy : derived.change)[0][i];
    return {
      key: rows.keys[i],
      values: derived.lines.map((_, k) => rows.text[k][i]),
      computed: state.mode === "level" ? null : value == null ? "—" : formatChange(value, derived.points),
      events: (events.value.get(rows.keys[i]) ?? []).map((e) => e.label).join(", "),
    };
  });
  return { total, shown, from: start + 1, to: start + count, computedLabel };
});
const pages = computed(() => (table.value ? Math.ceil(table.value.total / props.pageSize) : 0));

// ---- Drawing ---------------------------------------------------------------

const chartEl = ref(null);
const calendarEl = ref(null);
const navigatorEl = ref(null);
let plots = null;
let steering = false;

// Colours come from the stylesheet through the theme script, so a chart drawn
// without it would be drawn in the wrong mode's colours.
function isDark() {
  if (!window.xfinaTheme) {
    throw new Error("xfina-ui: SeriesExplorer needs the theme script in <head>; add xfina-ui/vite to the site's Vite plugins");
  }
  return window.xfinaTheme.isDark();
}

const context = () => ({
  ...loaded.value,
  state,
  monthly,
  unit: props.unit,
  events: events.value,
  dark: isDark(),
});

function draw() {
  if (!plots || !loaded.value) return;
  if (state.view === "chart") {
    renderChart(plots.chart, context());
    plots.chart.resize();
  } else if (state.view === "calendar") {
    renderCalendar(plots.calendar, context());
  }
}

// The slider follows the presets and the dates; while it is being set, its own
// "datazoom" event is ignored, or setting it would read back as a drag.
function steerNavigator() {
  if (!plots || !loaded.value) return;
  steering = true;
  renderNavigator(plots.navigator, context());
  steering = false;
}

let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    draw();
  });
}

const redrawAll = () => {
  steerNavigator();
  draw();
};
const onResize = () => {
  plots?.navigator.resize();
  draw();
};

watch(
  () => [state.view, state.mode, state.from, state.to],
  async () => {
    page.value = 0;
    await nextTick(); // the view's panel is shown before it is measured
    schedule();
    // The address carries what is on screen, so a view can be shared.
    if (props.syncUrl) {
      history.replaceState(history.state, "", location.pathname + writeQuery(state, defaultYears.value, defaultView));
    }
  },
);

// The rows a site holds can change under the explorer: another file picked, a
// dataset recomputed. The period opens afresh on the new series' length.
watch(
  () => [props.rows, props.loader],
  () => load(),
);

async function load() {
  loaded.value = null;
  page.value = 0;
  let input = props.rows;
  if (props.loader) {
    status.value = "Loading…";
    try {
      input = await props.loader();
    } catch (error) {
      status.value = `Could not load ${props.label}: ${error.message}`;
      return;
    }
  }
  status.value = "";
  const rows = rowsFrom(input, props.lines, monthly);
  loaded.value = { rows, derived: derive(rows, props.lines, props.change, monthly) };
  if (props.first == null || props.last == null) setBounds(rows.time[0], rows.time.at(-1));
  if (props.syncUrl) {
    Object.assign(
      state,
      readQuery(location.search, {
        views: props.views,
        modes: MODES.value,
        ranges: RANGES.value,
        first: bounds.value.first,
        last: bounds.value.last,
        monthly,
      }),
    );
  }
  await nextTick();
  redrawAll();
}

onMounted(async () => {
  // Three plots whatever the views are: the period slider is under all of
  // them, and the chart and calendar are kept drawn so switching view is
  // instant rather than a redraw from nothing.
  const { default: echarts } = await import("./echarts.js");
  plots = {
    chart: echarts.init(chartEl.value),
    calendar: echarts.init(calendarEl.value),
    navigator: echarts.init(navigatorEl.value),
  };
  plots.navigator.on("datazoom", () => {
    if (steering || !bounds.value) return;
    const zoom = plots.navigator.getOption().dataZoom[0];
    const { first, last } = bounds.value;
    const width = last - first;
    state.from = first + width * (zoom.start / 100);
    state.to = first + width * (zoom.end / 100);
    state.preset = null;
  });
  window.addEventListener("resize", onResize);
  window.addEventListener("themechange", redrawAll);
  await load();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("themechange", redrawAll);
  if (plots) Object.values(plots).forEach((p) => p.dispose());
});

const controlLabel = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3 px-6 max-sm:px-4" aria-label="Controls">
      <div v-if="VIEWS.length > 1">
        <span :class="controlLabel">View</span>
        <Segmented v-model="viewModel" :options="VIEWS" label="View" />
      </div>
      <div>
        <span :class="controlLabel">Values</span>
        <Segmented v-model="modeModel" :options="MODES.map(([value, label]) => ({ value, label }))" label="Values" />
      </div>
      <template v-if="bounds">
        <div>
          <span :class="controlLabel">Period</span>
          <Segmented v-model="rangeModel" :options="RANGES.map(([value, label]) => ({ value, label }))" label="Period" />
        </div>
        <div>
          <span :class="controlLabel">From – to</span>
          <div class="flex items-center gap-1.5 text-muted-foreground">
            <Input
              v-model="fromModel"
              type="date"
              class="h-9 w-auto tabular-nums"
              :min="ymd(bounds.first)"
              :max="ymd(bounds.last)"
              aria-label="Period starts"
            />
            <span aria-hidden="true">→</span>
            <Input
              v-model="toModel"
              type="date"
              class="h-9 w-auto tabular-nums"
              :min="ymd(bounds.first)"
              :max="ymd(bounds.last)"
              aria-label="Period ends"
            />
          </div>
        </div>
      </template>
      <p v-if="period" class="pb-2 text-sm tabular-nums text-muted-foreground">{{ period.text }}</p>
    </div>

    <div v-if="period?.stats.length" class="flex flex-wrap gap-x-3 gap-y-2 px-6 pt-4 max-sm:px-4" aria-live="polite">
      <div
        v-for="s in period.stats"
        :key="s.label"
        class="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-sm tabular-nums"
      >
        <span class="font-semibold">{{ s.label }}</span>
        <span><span class="mr-1.5 text-muted-foreground">From</span>{{ s.from }} → {{ s.to }}</span>
        <span><span class="mr-1.5 text-muted-foreground">Change</span>{{ s.change }}</span>
        <span v-if="s.cagr"><span class="mr-1.5 text-muted-foreground">CAGR</span>{{ s.cagr }}</span>
      </div>
    </div>

    <div class="p-6 max-sm:p-4">
      <div v-show="state.view === 'chart'">
        <div ref="chartEl" role="img" :aria-label="`${label}, chart`" class="h-[440px] w-full max-sm:h-80" />
      </div>
      <div v-show="state.view === 'calendar'" class="overflow-x-auto">
        <div ref="calendarEl" role="img" :aria-label="`${label}, calendar`" class="w-full min-w-[640px]" />
      </div>
      <div v-if="table" class="space-y-3">
        <Table container-class="max-h-[440px]" role="group" tabindex="0" :aria-label="`${label}, rows`">
          <TableHeader class="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow>
              <TableHead>{{ monthly ? "Month" : "Date" }}</TableHead>
              <TableHead v-for="line in lines" :key="line.label" class="text-right">{{ line.label }}</TableHead>
              <TableHead v-if="state.mode !== 'level'" class="text-right">{{ table.computedLabel }}</TableHead>
              <TableHead v-if="events.size">Events</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in table.shown" :key="row.key">
              <TableCell class="tabular-nums">{{ row.key }}</TableCell>
              <TableCell v-for="(value, k) in row.values" :key="k" class="text-right tabular-nums">{{ value }}</TableCell>
              <TableCell v-if="state.mode !== 'level'" class="text-right tabular-nums">{{ row.computed }}</TableCell>
              <TableCell v-if="events.size" class="text-muted-foreground">{{ row.events }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div v-if="pages > 1" class="flex items-center gap-3 text-sm tabular-nums text-muted-foreground">
          <Button size="sm" variant="outline" :disabled="page === 0" @click="page -= 1">Newer</Button>
          <Button size="sm" variant="outline" :disabled="page >= pages - 1" @click="page += 1">Older</Button>
          <span>{{ table.from }}–{{ table.to }} of {{ table.total }} rows, newest first</span>
        </div>
        <p v-else class="text-sm tabular-nums text-muted-foreground">{{ table.total }} rows, newest first</p>
      </div>
      <div ref="navigatorEl" aria-label="Period: drag to choose" class="mt-2 h-12 w-full" />
      <p class="mt-2 text-xs text-muted-foreground">{{ note }}</p>
      <p v-if="status" role="status" class="mt-2 text-xs text-muted-foreground">{{ status }}</p>
    </div>
  </div>
</template>
