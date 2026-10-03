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
    primary: "240 5.9% 10%",
    "primary-foreground": "0 0% 98%",
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
    primary: "0 0% 98%",
    "primary-foreground": "240 5.9% 10%",
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
// Validated (dataviz validate_palette.js, 2026-10-03) against these sites'
// own surfaces, white and zinc-950:
//   light on #ffffff: worst adjacent CVD ΔE 9.1, normal-vision ΔE 19.6. Slots
//     3, 4 and 5 are below 3:1 contrast, so a chart using them needs direct
//     labels or a table view.
//   dark on #09090b: worst adjacent CVD ΔE 8.4, normal-vision ΔE 19.3, all
//     slots at 3:1 or more.
// Scatter plots and other charts where every pair of series can sit side by
// side are only safe with the first three slots. Change any value here and the
// validator runs again, against both surfaces, before the change merges.
const chart = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

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
  return { ...out, ...status, ...statusText[name] };
}

export const colours = { light: mode("light"), dark: mode("dark") };

// Not colours, so the same in both modes.
export const constants = {
  radius: "0.5rem",
  "font-sans":
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "font-mono": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};
