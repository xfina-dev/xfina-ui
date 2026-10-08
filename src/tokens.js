// The one place every xfina.dev colour is defined. `npm run build` turns this
// into dist/xfina-ui.css; no site defines a colour of its own.
//
// Values are written either as shadcn's bare HSL triplets ("240 10% 3.9%")
// or as hex. The build emits triplets for both, because the Tailwind sites
// read every token as `hsl(var(--name))`, and one format means one way to use
// a token on every site.

// The UI greys are shadcn's zinc theme, exactly as xfina.dev and
// labs.xfina.dev already shipped it, so adopting this file changes nothing
// those two sites draw.
const ui = {
  light: {
    background: "0 0% 100%",
    foreground: "240 10% 3.9%",
    card: "0 0% 100%",
    "card-foreground": "240 10% 3.9%",
    popover: "0 0% 100%",
    "popover-foreground": "240 10% 3.9%",
    // Not shadcn zinc: the brand blue from the logo, so a default button,
    // a selection and a badge read as Xfina rather than as near-black.
    primary: "#4457d9",
    "primary-foreground": "#ffffff",
    secondary: "240 4.8% 95.9%",
    "secondary-foreground": "240 5.9% 10%",
    muted: "240 4.8% 95.9%",
    "muted-foreground": "240 3.8% 46.1%",
    accent: "240 4.8% 95.9%",
    "accent-foreground": "240 5.9% 10%",
    destructive: "0 84.2% 60.2%",
    "destructive-foreground": "0 0% 98%",
    border: "240 5.9% 90%",
    input: "240 5.9% 90%",
    ring: "240 10% 3.9%",
  },
  dark: {
    background: "240 10% 3.9%",
    foreground: "0 0% 98%",
    card: "240 10% 3.9%",
    "card-foreground": "0 0% 98%",
    popover: "240 10% 3.9%",
    "popover-foreground": "0 0% 98%",
    // A step lighter than light mode's, still with white text. zinc's
    // near-white primary made every default button the brightest thing on
    // a dark page.
    primary: "#5163de",
    "primary-foreground": "#ffffff",
    secondary: "240 3.7% 15.9%",
    "secondary-foreground": "0 0% 98%",
    muted: "240 3.7% 15.9%",
    "muted-foreground": "240 5% 64.9%",
    accent: "240 3.7% 15.9%",
    "accent-foreground": "0 0% 98%",
    destructive: "0 62.8% 30.6%",
    "destructive-foreground": "0 0% 98%",
    border: "240 3.7% 15.9%",
    input: "240 3.7% 15.9%",
    ring: "240 4.9% 83.9%",
  },
};

// Chart series, in the order they must be assigned: the order is what keeps
// neighbouring series apart for colour-blind readers, so a chart takes
// chart-1, chart-2, ... and never picks colours out of sequence.
//
// Validated (dataviz validate_palette.js, 2026-10-03 for slots 1-8,
// 2026-10-07 for all sixteen) against these sites' own surfaces, white and
// zinc-950, on the adjacent pairlist (neighbours in slot order):
//   light on #ffffff: worst adjacent CVD ΔE 9.1, normal-vision ΔE 19.6. Slots
//     3, 4 and 5 are below 3:1 contrast, so a chart using them needs direct
//     labels or a table view; slots 9-16 are all at 3:1 or more.
//   dark on #09090b: worst adjacent CVD ΔE 8.4, normal-vision ΔE 17.3, all
//     slots at 3:1 or more.
// Slots 1-8 are the dataviz reference palette, unchanged. Slots 9-16 were
// searched for, not picked by eye: inside each mode's lightness band, chroma
// 0.10 or more and 3:1 on the surface, the set whose neighbours (from slot 8
// on) clear the gates and whose closest pair anywhere is farthest apart. That
// closest pair is about half the gates (normal-vision ΔE 7.9 light, slots 11
// and 16) and cannot be made wider: sixteen colours in these bands do not
// all stay apart. So past eight series, some series that are not neighbours
// look alike, and a chart that shows more than eight names each one (a
// legend and direct labels, or a table), never by colour alone.
// Scatter plots and other charts where every pair of series can sit side by
// side are only safe with the first three slots. Change any value here and the
// validator runs again, against both surfaces, before the change merges.
const chart = {
  light: [
    "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948",
    "#76317d", "#4a621b", "#a2316e", "#4696c0", "#6443cc", "#b46669", "#7085ff", "#935785",
  ],
  dark: [
    "#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767",
    "#8c4593", "#6e8843", "#b3417d", "#4999c3", "#7c60eb", "#974c50", "#4350c4", "#b677a6",
  ],
};

// How many series colours there are, for the chart helpers and ColorPicker.
export const chartSlots = chart.light.length;

// The slots around the colour wheel, for showing them to a reader who is
// choosing one (ColorPicker): reds to yellow, greens to sky, blues to
// violets, purples to pinks. In slot order the neighbours are deliberately
// unlike, so finding "a green" meant scanning all sixteen. This is only how
// they are shown: a chart still assigns them in slot order. The same order
// holds in both modes, which a test checks.
export const chartByHue = [14, 8, 2, 4, 10, 6, 3, 12, 1, 15, 7, 13, 9, 16, 11, 5];

// Magnitude (sequential, one hue, faint to strong) and change (diverging: blue
// for a fall, a grey midpoint for none, red for a rise), as data.xfina.dev's
// calendars draw them. In dark mode the sequential ramp runs the other way,
// so "more" is always the step that stands out most from the surface.
const ramps = {
  light: {
    seq: ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"],
    div: ["#184f95", "#6da7ec", "#f0efec", "#ec8381", "#952020"],
  },
  dark: {
    seq: ["#0d366b", "#1c5cab", "#3987e5", "#86b6ef", "#cde2fb"],
    div: ["#86b6ef", "#2f5f9c", "#383835", "#9c3a38", "#f08c8a"],
  },
};

// State, never a series. Deliberately unlike every chart slot, and always shown
// with an icon and a label, never by colour alone.
const status = {
  "status-good": "#0ca30c",
  "status-warning": "#fab219",
  "status-serious": "#ec835a",
  "status-critical": "#d03b3b",
};

// The brand blue as text: a link, a badge's label, a hovered title. In dark
// mode the button blue is too dark to read as text on the page (4.0:1), so
// text takes a lighter step. Held to 4.5:1 on the page and on a 10% tint of
// the button blue by a test:
//   light: 5.8 on the page, 5.0 on the tint
//   dark:  6.5 on the page, 6.1 on the tint
const primaryText = {
  light: { "primary-text": "#4457d9" },
  dark: { "primary-text": "#7d8cf2" },
};

// Status as text, such as a badge's label. The status colours themselves are
// too light to read as small text on a light surface (warning is 1.7:1), so
// text takes a step that reaches 4.5:1 on the badge's 12% tint of its status,
// in each mode:
//   light: good 6.6, warning 5.5, serious 5.2, critical 5.5
//   dark:  good 5.3, warning 9.1, serious 6.6, critical 6.4
const statusText = {
  light: {
    "status-good-text": "#006300",
    "status-warning-text": "#8a5a00",
    "status-serious-text": "#a8481a",
    "status-critical-text": "#b42318",
  },
  dark: {
    "status-good-text": "#0ca30c",
    "status-warning-text": "#fab219",
    "status-serious-text": "#ec835a",
    "status-critical-text": "#f07070",
  },
};

function mode(name) {
  const out = { ...ui[name] };
  chart[name].forEach((hex, i) => (out[`chart-${i + 1}`] = hex));
  for (const [ramp, steps] of Object.entries(ramps[name])) {
    steps.forEach((hex, i) => (out[`${ramp}-${i + 1}`] = hex));
  }
  return { ...out, ...primaryText[name], ...status, ...statusText[name] };
}

export const colours = { light: mode("light"), dark: mode("dark") };

// Not colours, so the same in both modes.
export const constants = {
  radius: "0.5rem",
  "font-sans":
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "font-mono": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};
