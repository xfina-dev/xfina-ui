// Table: a site can size the scrolling wrapper, so a sticky header sticks.

import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { Table } from "@/index.js";

describe("Table", () => {
  test("wraps the table in shadcn's scrolling container by default", () => {
    const wrapper = mount(Table, { props: { class: "min-w-[40rem]" } });
    expect(wrapper.classes()).toEqual(["relative", "w-full", "overflow-auto"]);
    expect(wrapper.get("table").classes()).toContain("min-w-[40rem]");
  });

  test("container-class reaches the wrapper, not the table", () => {
    const wrapper = mount(Table, { props: { containerClass: "h-full" } });
    expect(wrapper.classes()).toContain("h-full");
    expect(wrapper.get("table").classes()).not.toContain("h-full");
  });

  test("a site's container class wins over the default it conflicts with", () => {
    const wrapper = mount(Table, { props: { containerClass: "overflow-visible max-h-96" } });
    expect(wrapper.classes()).toEqual(["relative", "w-full", "overflow-visible", "max-h-96"]);
  });
});
