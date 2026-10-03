// The header and the family cards, as a site mounts them.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { XfinaFamily, XfinaHeader, FAMILY, SITES, USED_BY } from "@/index.js";

let toggles;
beforeEach(() => {
  toggles = 0;
  window.xfinaTheme = { isDark: () => true, toggle: () => (toggles += 1) };
});
afterEach(() => {
  delete window.xfinaTheme;
  document.body.innerHTML = "";
});

const links = (wrapper) => wrapper.findAll("nav > div:first-child a");

describe("XfinaHeader", () => {
  test("names its site, and the switcher offers the rest of the family in order", () => {
    const expected = { xfina: ["Labs", "Xfingine", "Data"], labs: ["Xfina", "Xfingine", "Data"], data: ["Xfina", "Labs", "Xfingine"] };
    for (const [site, labels] of Object.entries(expected)) {
      const wrapper = mount(XfinaHeader, { props: { site } });
      expect(wrapper.text()).toContain(SITES.find((s) => s.id === site).title);
      expect(links(wrapper).map((a) => a.text().replace(/\(.*\)/, "").trim())).toEqual(labels);
    }
  });

  test("Xfingine, which has no site, opens its repository in a new tab", () => {
    const wrapper = mount(XfinaHeader, { props: { site: "data" } });
    const xfingine = links(wrapper).find((a) => a.attributes("href") === "https://github.com/xfina-dev/xfingine");
    expect(xfingine.attributes("target")).toBe("_blank");
    expect(xfingine.attributes("rel")).toBe("noopener noreferrer");
    expect(xfingine.text()).toContain("opens in a new tab");
    for (const a of links(wrapper).filter((a) => a.element !== xfingine.element)) expect(a.attributes("target")).toBeUndefined();
  });

  test("an unknown site fails as the page is built", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => mount(XfinaHeader, { props: { site: "xfingine" } })).toThrow(/unknown site "xfingine"/);
  });

  test("the title is the page's heading only when asked", () => {
    expect(mount(XfinaHeader, { props: { site: "data" } }).find("h1").exists()).toBe(false);
    expect(mount(XfinaHeader, { props: { site: "data", heading: true } }).find("h1").text()).toBe("Xfina Data");
  });

  test("the site's picker and tagline go in slots", () => {
    const wrapper = mount(XfinaHeader, {
      props: { site: "labs" },
      slots: { context: "<select id='app'></select>", tagline: "Portfolio Engine" },
    });
    expect(wrapper.find("#app").exists()).toBe(true);
    expect(wrapper.text()).toContain("Portfolio Engine");
    expect(wrapper.text()).not.toContain("Experimental finance tools");
  });

  test("the theme button toggles the shared theme", async () => {
    const wrapper = mount(XfinaHeader, { props: { site: "data" } });
    await wrapper.get('[title="Toggle theme"]').trigger("click");
    expect(toggles).toBe(1);
  });

  test("privacy opens the built-in dialog, or hands over to a site that runs analytics", async () => {
    const plain = mount(XfinaHeader, { props: { site: "data" }, attachTo: document.body });
    await plain.get('[title="Privacy & analytics"]').trigger("click");
    await new Promise((r) => setTimeout(r));
    expect(document.body.textContent).toContain("data.xfina.dev runs no analytics");
    plain.unmount();

    const own = mount(XfinaHeader, { props: { site: "xfina", ownPrivacy: true } });
    await own.get('[title="Privacy & analytics"]').trigger("click");
    expect(own.emitted("privacy")).toHaveLength(1);
  });

  test("Building Wealth opens the author's page in a new tab", () => {
    const wrapper = mount(XfinaHeader, { props: { site: "data" } });
    const link = wrapper.findAll("a").find((a) => a.text() === "Building Wealth");
    expect(link.attributes("href")).toBe("https://sakthipriyan.com/building-wealth");
    expect(link.attributes("target")).toBe("_blank");
  });
});

describe("XfinaFamily", () => {
  test("one card per member, in order; this site's card says so and does not link", () => {
    const wrapper = mount(XfinaFamily, { props: { site: "labs" } });
    const cards = wrapper.findAll("h3").map((h) => h.text().replace("· this site", "").trim()).filter((t) => t !== "Used by");
    expect(cards).toEqual(FAMILY.map((m) => m.title));
    const current = wrapper.find('[aria-current="page"]');
    expect(current.element.tagName).toBe("DIV");
    expect(current.text()).toContain("Xfina Labs");
    expect(wrapper.findAll("a")).toHaveLength(FAMILY.length - 1 + USED_BY.length);
  });

  test("lists the products built on the family apart, with what each uses", () => {
    const wrapper = mount(XfinaFamily, { props: { site: "data" } });
    const usedBy = wrapper.findAll("a[target=_blank]").filter((a) => USED_BY.some((p) => p.url === a.attributes("href")));
    expect(usedBy.map((a) => a.attributes("href"))).toEqual([
      "https://xsteer.in/",
      "https://sakthipriyan.com/building-wealth/tools/realvalue-portfolio/",
    ]);
    expect(usedBy[0].text()).toContain("The Personal Finance OS");
    expect(usedBy[0].text()).toContain("In active development");
    expect(usedBy[0].text()).toContain("Built on Xfina, Xfingine and Xfina Data");
    expect(usedBy[1].text()).toContain("RealValue Portfolio");
    expect(usedBy[1].text()).toContain("Built on Xfina Data");
    expect(usedBy[1].text()).not.toContain("In active development");
    // Every product names only real family members.
    for (const p of USED_BY) for (const id of p.uses) expect(FAMILY.map((m) => m.id)).toContain(id);
  });
});

describe("XfinaProvider", () => {
  test("opening a Select does not pad the page by the scrollbar's width", async () => {
    // reka-ui pads <body> by innerWidth - clientWidth while a modal is open.
    // style.css already reserves the scrollbar's space, so any padding moves
    // the page. jsdom has no scrollbar, so fake one 11px wide.
    const { XfinaProvider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = await import("@/index.js");
    const { h } = await import("vue");
    Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: window.innerWidth - 11 });
    const wrapper = mount(
      { render: () => h(XfinaProvider, () => h(Select, { open: true }, () => [h(SelectTrigger, () => h(SelectValue)), h(SelectContent, () => h(SelectItem, { value: "a" }, () => "A"))])) },
      { attachTo: document.body },
    );
    await new Promise((r) => setTimeout(r));
    expect(document.body.style.paddingRight).toBe("0px");
    wrapper.unmount();
    delete document.documentElement.clientWidth;
  });
});

describe("Segmented", () => {
  test("marks the chosen option with a tint and outline, not a filled primary", async () => {
    const { Segmented } = await import("@/index.js");
    const wrapper = mount(Segmented, { props: { modelValue: "5Y", options: ["1Y", "5Y"], label: "Period" } });
    const [one, five] = wrapper.findAll("button");
    expect(five.attributes("aria-pressed")).toBe("true");
    expect(one.attributes("aria-pressed")).toBe("false");
    // A filled primary is a near-white block in dark mode.
    expect(five.classes()).not.toContain("bg-primary");
    expect(five.classes()).toContain("bg-primary/5");
    await one.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([["1Y"]]);
  });
});
