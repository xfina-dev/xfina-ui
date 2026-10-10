// ColorPicker: a theme colour picked from a swatch, as Labs' Allocation table
// colours each asset.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { ColorPicker, TooltipProvider } from "@/index.js";
import { chartByHue, colours } from "../src/tokens.js";

const CHART = Array.from({ length: 16 }, (_, i) => `chart-${i + 1}`);
// How the picker shows them by default, four rows around the colour wheel:
//   chart-14 chart-8  chart-2  chart-4
//   chart-10 chart-6  chart-3  chart-12
//   chart-1  chart-15 chart-7  chart-13
//   chart-9  chart-16 chart-11 chart-5
const BY_HUE = chartByHue.map((n) => `chart-${n}`);

beforeEach(() => {
  for (const c of CHART) document.documentElement.style.setProperty(`--${c}`, colours.light[c]);
});
afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.body.innerHTML = "";
});

// As a site mounts it: inside the provider XfinaProvider brings, with the
// value held by the page.
function picker(props = {}) {
  const value = ref("modelValue" in props ? props.modelValue : "chart-3");
  const Host = defineComponent(() => () =>
    h(TooltipProvider, null, () =>
      h(ColorPicker, { label: "Colour for Gold", ...props, modelValue: value.value, "onUpdate:modelValue": (v) => (value.value = v) }),
    ),
  );
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, value, trigger: () => wrapper.get("button") };
}

const swatches = () => [...document.querySelectorAll('[role="radio"]')];
const group = () => document.querySelector('[role="radiogroup"]');
async function open(trigger) {
  await trigger().trigger("click");
  await flushPromises();
}
async function key(name) {
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
  await nextTick();
}

describe("ColorPicker", () => {
  test("the trigger names what it colours and the colour chosen", () => {
    const { trigger } = picker();
    // Named by its slot, though the picker shows it seventh.
    expect(trigger().attributes("aria-label")).toBe("Colour for Gold: Colour 3");
    expect(trigger().find("span").attributes("style")).toContain("var(--chart-3)");
  });

  test("offers every chart slot, grouped by hue, the chosen one checked", async () => {
    const { trigger } = picker();
    await open(trigger);
    expect(group().getAttribute("aria-label")).toBe("Colour for Gold");
    expect(swatches().map((s) => s.dataset.color)).toEqual(BY_HUE);
    expect([...BY_HUE].sort()).toEqual([...CHART].sort());
    // Each named by its slot, wherever the hue grouping puts it.
    expect(swatches().map((s) => s.getAttribute("aria-label"))).toEqual(chartByHue.map((n) => `Colour ${n}`));
    const checked = swatches().filter((s) => s.getAttribute("aria-checked") === "true");
    expect(checked.map((s) => s.dataset.color)).toEqual(["chart-3"]);
    expect(checked[0].querySelector("svg")).not.toBeNull();
    expect(swatches().filter((s) => s.querySelector("svg"))).toHaveLength(1);
  });

  test("marks the colours other items use, and names who uses them", async () => {
    const { trigger } = picker({ used: { "chart-1": "Nifty 50", "chart-6": "Nasdaq 100, Bonds" } });
    await open(trigger);
    const marked = swatches().filter((s) => s.querySelector("[data-used]"));
    expect(marked.map((s) => s.dataset.color)).toEqual(["chart-6", "chart-1"]);
    expect(swatches()[8].getAttribute("aria-label")).toBe("Colour 1, used by Nifty 50");
    expect(swatches()[5].getAttribute("aria-label")).toBe("Colour 6, used by Nasdaq 100, Bonds");
  });

  test("a click picks the colour and closes", async () => {
    const { trigger, value } = picker();
    await open(trigger);
    swatches()[0].click();
    await flushPromises();
    expect(value.value).toBe("chart-14");
    expect(group()).toBeNull();
    expect(trigger().attributes("aria-label")).toBe("Colour for Gold: Colour 14");
  });

  test("the grid is as near a square as the set allows", async () => {
    // 8 is 3×3 with a gap, 10 is 4 wide, 16 is 4×4, 17 to 25 are 5, 26 is 6.
    for (const [n, columns] of [[1, 1], [4, 2], [8, 3], [9, 3], [10, 4], [16, 4], [17, 5], [25, 5], [26, 6]]) {
      const colors = Array.from({ length: n }, (_, i) => `t-${i + 1}`);
      for (const c of colors) document.documentElement.style.setProperty(`--${c}`, "#000000");
      const { trigger, wrapper } = picker({ colors, modelValue: "t-1" });
      await open(trigger);
      expect(group().style.gridTemplateColumns, `${n} colours`).toBe(`repeat(${columns}, minmax(0, 1fr))`);
      wrapper.unmount();
      document.body.innerHTML = "";
    }
  });

  test("a site can set the width, and Up and Down follow it", async () => {
    const { trigger } = picker({ columns: 2 });
    await open(trigger);
    expect(group().style.gridTemplateColumns).toBe("repeat(2, minmax(0, 1fr))");
    expect(document.activeElement.dataset.color).toBe("chart-3");
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-1");
    await key("ArrowUp");
    await key("ArrowUp");
    expect(document.activeElement.dataset.color).toBe("chart-10");
  });

  test("one row of all sixteen, when asked", async () => {
    const { trigger } = picker({ columns: 16 });
    await open(trigger);
    expect(group().style.gridTemplateColumns).toBe("repeat(16, minmax(0, 1fr))");
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-3");
  });

  test("a width that is not a whole number from 1 throws", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const columns of [0, -1, 2.5]) {
      expect(() => picker({ columns }), String(columns)).toThrow(/columns must be a whole number from 1, not/);
      document.body.innerHTML = "";
    }
  });

  test("arrows move focus across the grid without picking; one tab stop", async () => {
    const { trigger, value } = picker();
    await open(trigger);
    // Opens on the chosen colour. The sixteen chart slots are 4×4.
    expect(group().style.gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
    expect(document.activeElement.dataset.color).toBe("chart-3");
    await key("ArrowRight");
    expect(document.activeElement.dataset.color).toBe("chart-12");
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-13");
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-5");
    // The last row has nowhere further down to go.
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-5");
    await key("ArrowUp");
    expect(document.activeElement.dataset.color).toBe("chart-13");
    await key("End");
    await key("ArrowRight");
    expect(document.activeElement.dataset.color).toBe("chart-14");
    await key("ArrowUp");
    expect(document.activeElement.dataset.color).toBe("chart-14");
    await key("End");
    expect(document.activeElement.dataset.color).toBe("chart-5");
    await key("Home");
    expect(document.activeElement.dataset.color).toBe("chart-14");
    expect(swatches().filter((s) => s.tabIndex === 0).map((s) => s.dataset.color)).toEqual(["chart-14"]);
    expect(value.value).toBe("chart-3");
  });

  test("Down stays put above a gap in a short last row", async () => {
    // Eight colours are three rows of three, the last one short.
    const { trigger } = picker({ colors: CHART.slice(0, 8), modelValue: "chart-6" });
    await open(trigger);
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-6");
    await key("ArrowLeft");
    await key("ArrowDown");
    expect(document.activeElement.dataset.color).toBe("chart-8");
  });

  test("Escape closes without picking", async () => {
    const { trigger, value } = picker();
    await open(trigger);
    await key("ArrowRight");
    await key("Escape");
    await flushPromises();
    expect(group()).toBeNull();
    expect(value.value).toBe("chart-3");
  });

  test("offers another set when given one", async () => {
    for (const c of ["seq-1", "seq-2", "seq-3"]) document.documentElement.style.setProperty(`--${c}`, "#000000");
    const { trigger } = picker({ colors: ["seq-3", "seq-1", "seq-2"], modelValue: "seq-1" });
    await open(trigger);
    expect(swatches().map((s) => s.dataset.color)).toEqual(["seq-3", "seq-1", "seq-2"]);
    // Tokens other than the chart slots are numbered by their place.
    expect(swatches().map((s) => s.getAttribute("aria-label"))).toEqual(["Colour 1", "Colour 2", "Colour 3"]);
    expect(trigger().attributes("aria-label")).toBe("Colour for Gold: Colour 2");
  });

  test("with no colour yet, says so", () => {
    const { trigger } = picker({ modelValue: null });
    expect(trigger().attributes("aria-label")).toBe("Colour for Gold: none");
  });

  test("a value outside the set throws rather than showing nothing chosen", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => picker({ modelValue: "chart-17" })).toThrow(/"chart-17" is not one of chart-1/);
  });

  test("an undefined token throws rather than drawing a blank swatch", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => picker({ colors: ["chart-1", "chart-nine"], modelValue: "chart-1" })).toThrow(/--chart-nine is not defined/);
  });
});
