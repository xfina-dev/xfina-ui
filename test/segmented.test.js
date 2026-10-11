// Segmented: one choice of a few. By default a filter among controls; with
// variant="primary", a switch that stands out as much as the page's main
// button.

import { describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { Segmented } from "@/index.js";

const units = (props = {}) =>
  mount(Segmented, { props: { modelValue: "Real", options: ["Nominal", "Real"], label: "Units", ...props } });

describe("Segmented", () => {
  test("marks the chosen option with a tint and outline, not a filled primary", async () => {
    const wrapper = mount(Segmented, { props: { modelValue: "5Y", options: ["1Y", "5Y"], label: "Period" } });
    const [one, five] = wrapper.findAll("button");
    expect(five.attributes("aria-pressed")).toBe("true");
    expect(one.attributes("aria-pressed")).toBe("false");
    // The default variant marks a choice as `selected` does, an outline on a
    // tint; only variant="primary" fills it.
    expect(five.classes()).not.toContain("bg-primary");
    expect(five.classes()).toContain("bg-primary/5");
    // The end buttons follow the group's rounded inside corner, so a chosen
    // end button's outline closes.
    expect(one.classes()).toContain("first:rounded-l-[calc(var(--radius)-3px)]");
    expect(five.classes()).toContain("last:rounded-r-[calc(var(--radius)-3px)]");
    await one.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([["1Y"]]);
  });
});

describe("Segmented sizes and variants", () => {
  test("with neither size nor variant, it looks as it did", () => {
    const wrapper = units();
    expect(wrapper.classes()).toEqual(expect.arrayContaining(["rounded-md", "border", "h-9"]));
    const [nominal, real] = wrapper.findAll("button");
    expect(real.classes()).toEqual(expect.arrayContaining(["h-[34px]", "px-3", "text-sm", "bg-primary/5"]));
    expect(nominal.classes()).toContain("bg-background");
  });

  test("default and lg are level with Button sm and lg; sm is a compact 32px", () => {
    for (const [size, group, option] of [["sm", "h-8", "h-[30px]"], ["default", "h-9", "h-[34px]"], ["lg", "h-11", "h-[42px]"]]) {
      const wrapper = units({ size });
      expect(wrapper.classes(), size).toContain(group);
      for (const b of wrapper.findAll("button")) expect(b.classes(), size).toContain(option);
    }
  });

  test("primary fills the chosen option as a default Button, in a padded group", () => {
    const wrapper = units({ variant: "primary", size: "lg" });
    expect(wrapper.attributes("role")).toBe("group");
    expect(wrapper.attributes("aria-label")).toBe("Units");
    expect(wrapper.classes()).toEqual(expect.arrayContaining(["rounded-lg", "border", "p-[3px]", "gap-1", "h-11"]));
    const [nominal, real] = wrapper.findAll("button");
    expect(real.attributes("aria-pressed")).toBe("true");
    expect(real.classes()).toEqual(expect.arrayContaining(["bg-primary", "text-primary-foreground", "h-9", "px-6"]));
    expect(nominal.attributes("aria-pressed")).toBe("false");
    expect(nominal.classes()).not.toContain("bg-primary");
    expect(nominal.classes()).toContain("hover:bg-accent");
  });

  test("primary keeps the choice, the click and the disabled options", async () => {
    const wrapper = units({ variant: "primary", options: ["Nominal", "Real", "PPP"], disabled: ["PPP"] });
    const [nominal, , ppp] = wrapper.findAll("button");
    expect(ppp.attributes("disabled")).toBeDefined();
    await nominal.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([["Nominal"]]);
  });

  test("an unknown size or variant throws rather than drawing an unstyled group", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => units({ size: "xl" })).toThrow(/Segmented size "xl" is not one of sm, default, lg/);
    expect(() => units({ variant: "filled" })).toThrow(/Segmented variant "filled" is not one of default, primary/);
  });
});
