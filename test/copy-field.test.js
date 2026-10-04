// CopyField: a value joined to its copy button.

import { afterEach, describe, expect, test, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { CopyField } from "@/index.js";

const URL_TEXT = "https://data.xfina.dev/v1/inflation/in-cpi-imf.csv";

afterEach(() => {
  vi.useRealTimers();
  delete navigator.clipboard;
});

const withClipboard = (writeText) => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

describe("CopyField", () => {
  test("shows the value, as a link when given one", () => {
    const wrapper = mount(CopyField, { props: { value: URL_TEXT, href: "/v1/inflation/in-cpi-imf.csv" } });
    expect(wrapper.get("a").text()).toBe(URL_TEXT);
    expect(wrapper.get("a").attributes("href")).toBe("/v1/inflation/in-cpi-imf.csv");
    expect(wrapper.get("button").attributes("aria-label")).toBe("Copy URL");
  });

  test("copies, confirms with a check as an added item does, then goes back", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue();
    withClipboard(writeText);
    const wrapper = mount(CopyField, { props: { value: URL_TEXT } });
    const button = wrapper.get("button");
    const width = button.classes().find((c) => c.startsWith("w-"));

    await button.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith(URL_TEXT);
    expect(button.text()).toBe("Copied");
    expect(button.find("svg").exists()).toBe(true);
    expect(button.classes()).toContain("bg-primary/5");
    // One width, whatever it says: the control does not jump.
    expect(button.classes().find((c) => c.startsWith("w-"))).toBe(width);
    expect(wrapper.text()).toContain("URL copied");

    vi.advanceTimersByTime(1500);
    await flushPromises();
    expect(button.text()).toBe("Copy");
    expect(button.classes()).not.toContain("bg-primary/5");
  });

  test("a refused clipboard says so instead of claiming a copy", async () => {
    withClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const wrapper = mount(CopyField, { props: { value: URL_TEXT } });
    await wrapper.get("button").trigger("click");
    await flushPromises();
    expect(wrapper.get("button").text()).toBe("Failed");
    expect(wrapper.text()).toContain("Could not copy the URL");
  });

  test("a second copy restarts the confirmation rather than cutting it short", async () => {
    vi.useFakeTimers();
    withClipboard(vi.fn().mockResolvedValue());
    const wrapper = mount(CopyField, { props: { value: URL_TEXT } });
    const button = wrapper.get("button");
    await button.trigger("click");
    await flushPromises();
    vi.advanceTimersByTime(1000);
    await button.trigger("click");
    await flushPromises();
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(button.text()).toBe("Copied");
  });
});
