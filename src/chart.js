// Charts. Tokens are bare HSL triplets ("212.8 67.7% 50.2%") for CSS to wrap
// in hsl(); a chart library such as ECharts needs a colour it can parse, so the
// browser resolves each token to rgb() through a probe. Read them at draw
// time, and again on `themechange`: the values differ between light and dark.

let probe;

export function colour(token) {
  if (!getComputedStyle(document.documentElement).getPropertyValue(token).trim()) {
    throw new Error(`xfina-ui: ${token} is not defined; is xfina-ui/style.css imported?`);
  }
  if (!probe) {
    probe = document.createElement("span");
    probe.hidden = true;
    document.documentElement.append(probe);
  }
  probe.style.color = `hsl(var(${token}))`;
  return getComputedStyle(probe).color;
}

const steps = (prefix, count) => Array.from({ length: count }, (_, i) => colour(`--${prefix}-${i + 1}`));

// Series colours, in the order they must be assigned.
export const series = () => steps("chart", 8);

// Five-step ramps: "seq" for magnitude, "div" for change (fall, none, rise).
export const ramp = (name) => steps(name, 5);

// ECharts option fragments in the shared style: spread them into a chart's
// options, so every chart on every site has the same text, axes, legend and
// tooltip, and each site's chart code decides only what is plotted.
export function echarts() {
  const ink = colour("--foreground");
  const muted = colour("--muted-foreground");
  const line = colour("--border");
  return {
    color: series(),
    textStyle: { color: ink, fontFamily: "inherit" },
    legend: { textStyle: { color: ink }, icon: "roundRect" },
    tooltip: {
      backgroundColor: colour("--popover"),
      borderColor: line,
      textStyle: { color: colour("--popover-foreground") },
      axisPointer: { lineStyle: { color: muted } },
    },
    axis: {
      axisLine: { lineStyle: { color: line } },
      axisLabel: { color: muted },
      nameTextStyle: { color: muted },
      splitLine: { lineStyle: { color: line } },
    },
  };
}
