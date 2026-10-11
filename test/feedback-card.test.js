// FeedbackCard: how was it, then the way forward that fits the answer.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createSSRApp, h, nextTick } from "vue";
import { renderToString } from "vue/server-renderer";
import { mount, flushPromises } from "@vue/test-utils";
import { FeedbackCard } from "@/index.js";

const KEY = "xfina_labs_feedback_portfolio-engine";
const LABS = { product: "Xfina Labs", tool: "Portfolio Engine", repo: "https://github.com/xfina-dev/xfina-labs", storageKey: KEY };

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  delete navigator.clipboard;
  delete navigator.share;
});

const card = (props = {}) => mount(FeedbackCard, { props: { ...LABS, ...props } });
const answers = (wrapper) => wrapper.get('[role="group"]').findAll("button");
const pressed = (wrapper) => answers(wrapper).map((b) => b.attributes("aria-pressed"));
const link = (wrapper, text) => wrapper.findAll("a").find((a) => a.text() === text);
const query = (href) => Object.fromEntries(new URL(href).searchParams);

describe("FeedbackCard", () => {
  test("asks how it was, under a title naming the product and tool", () => {
    const wrapper = card();
    expect(wrapper.get("h3").text()).toBe("Xfina Labs / Portfolio Engine · Feedback");
    expect(wrapper.text()).toContain("How was Portfolio Engine for you? It is free and open source");
    expect(answers(wrapper).map((b) => b.text())).toEqual(["Useful", "Could be better"]);
    expect(pressed(wrapper)).toEqual(["false", "false"]);
    expect(wrapper.text()).toContain("Anytime: report a problem · request a feature · source on GitHub.");
  });

  test("without a tool, the product is named and fills the issue forms' Tool", () => {
    const wrapper = card({ tool: undefined, product: "Xfina Data", repo: "https://github.com/xfina-dev/xfina-data" });
    expect(wrapper.get("h3").text()).toBe("Xfina Data · Feedback");
    expect(wrapper.text()).toContain("How was Xfina Data for you?");
    expect(query(link(wrapper, "request a feature").attributes("href")).tool).toBe("Xfina Data");
  });

  test("Useful offers a star, a share and a story, and is remembered", async () => {
    const wrapper = card();
    await answers(wrapper)[0].trigger("click");
    expect(pressed(wrapper)).toEqual(["true", "false"]);
    expect(wrapper.text()).toContain("Thank you! If you would like to say thanks");
    const star = link(wrapper, "Star on GitHub");
    expect(star.attributes()).toMatchObject({ href: LABS.repo, target: "_blank", rel: "noopener" });
    expect(query(link(wrapper, "Tell us what you used it for").attributes("href"))).toEqual({ template: "story.yml", tool: "Portfolio Engine" });
    expect(wrapper.text()).toContain("Share");
    expect(wrapper.text()).toContain("Anytime:");
    expect(localStorage.getItem(KEY)).toBe("up");
  });

  test("Could be better offers a report and a request, and drops the footer", async () => {
    const wrapper = card();
    await answers(wrapper)[1].trigger("click");
    expect(pressed(wrapper)).toEqual(["false", "true"]);
    expect(wrapper.text()).toContain("Thanks for saying so. What got in the way?");
    const problem = new URL(link(wrapper, "Report a problem").attributes("href"));
    expect(problem.origin + problem.pathname).toBe(`${LABS.repo}/issues/new`);
    expect(query(problem.href)).toEqual({
      template: "problem.yml",
      tool: "Portfolio Engine",
      environment: `Page: ${location.origin}${location.pathname}\nBrowser: ${navigator.userAgent}`,
    });
    expect(query(link(wrapper, "Request a feature").attributes("href"))).toEqual({ template: "idea.yml", tool: "Portfolio Engine" });
    expect(wrapper.text()).not.toContain("Anytime:");
    expect(localStorage.getItem(KEY)).toBe("down");
  });

  test("the other answer switches it; the same one again clears it", async () => {
    const wrapper = card();
    await answers(wrapper)[0].trigger("click");
    await answers(wrapper)[1].trigger("click");
    expect(pressed(wrapper)).toEqual(["false", "true"]);
    await answers(wrapper)[1].trigger("click");
    expect(pressed(wrapper)).toEqual(["false", "false"]);
    expect(wrapper.text()).toContain("How was Portfolio Engine for you?");
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  test("a remembered answer is shown once mounted; anything else is not an answer", async () => {
    localStorage.setItem(KEY, "down");
    const wrapper = card();
    await nextTick();
    expect(pressed(wrapper)).toEqual(["false", "true"]);
    expect(wrapper.text()).toContain("Report a problem");
    localStorage.setItem(KEY, "maybe");
    const other = card();
    await nextTick();
    expect(pressed(other)).toEqual(["false", "false"]);
  });

  // vite-ssg renders the page in Node, with no storage, and the browser
  // hydrates it. Production hydration keeps the server's class and
  // aria-pressed, so the first client render must match the server's.
  test("a static render hydrates without a mismatch, then shows the remembered answer", async () => {
    localStorage.setItem(KEY, "up");
    const app = () => createSSRApp({ render: () => h(FeedbackCard, LABS) });
    const html = await renderToString(app());
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('aria-pressed="true"');
    const root = document.createElement("div");
    root.innerHTML = html;
    document.body.append(root);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const mounted = app();
    mounted.mount(root);
    await nextTick();
    expect([...warn.mock.calls, ...error.mock.calls].flat().join("\n")).not.toMatch(/hydration/i);
    const buttons = root.querySelectorAll('[role="group"] button');
    expect([...buttons].map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(root.textContent).toContain("Star on GitHub");
    mounted.unmount();
    root.remove();
  });

  test("blocked storage still answers, for this visit", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const wrapper = card();
    await answers(wrapper)[0].trigger("click");
    expect(pressed(wrapper)).toEqual(["true", "false"]);
  });

  test("Share copies the page's link where there is no share sheet, and says so for 2s", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    localStorage.setItem(KEY, "up");
    const wrapper = card();
    await nextTick();
    const share = wrapper.findAll("button").find((b) => b.text() === "Share");
    await share.trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith(`${location.origin}${location.pathname}`);
    expect(share.text()).toBe("Link copied");
    vi.advanceTimersByTime(2000);
    await flushPromises();
    expect(share.text()).toBe("Share");
  });

  test("Share opens the share sheet where there is one", async () => {
    const share = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    localStorage.setItem(KEY, "up");
    const wrapper = card();
    await nextTick();
    await wrapper.findAll("button").find((b) => b.text() === "Share").trigger("click");
    expect(share).toHaveBeenCalledWith({ title: "Portfolio Engine · Xfina Labs", url: `${location.origin}${location.pathname}` });
  });

  test("templates rename a form; the rest keep their names", () => {
    const wrapper = card({ templates: { problem: "bug" } });
    expect(query(link(wrapper, "report a problem").attributes("href")).template).toBe("bug.yml");
    expect(query(link(wrapper, "request a feature").attributes("href")).template).toBe("idea.yml");
  });

  test("the nudge sits above the card, between two rules", () => {
    expect(card().text()).not.toContain("Found this useful?");
    const wrapper = card({ nudge: "Found this useful? A minute of feedback shapes what we build next." });
    expect(wrapper.element.firstElementChild.textContent.trim()).toBe("Found this useful? A minute of feedback shapes what we build next.");
  });

  test("a repository that is not a GitHub repository URL, or an unknown template, throws", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => card({ repo: "https://github.com/xfina-dev/xfina-labs/" })).toThrow(/repo must be/);
    expect(() => card({ repo: "xfina-dev/xfina-labs" })).toThrow(/repo must be/);
    expect(() => card({ templates: { bug: "bug" } })).toThrow(/unknown template "bug"/);
  });

  // GitHub fills a form's field from the query parameter named by its id.
  test("the issue forms sites copy have the ids the links fill", () => {
    // Vitest runs from the repository root.
    const form = (name) => readFileSync(join("issue-templates", `${name}.yml`), "utf8");
    const ids = (name) => [...form(name).matchAll(/^\s+id: (\w+)$/gm)].map((m) => m[1]);
    expect(ids("problem")).toEqual(["tool", "what", "steps", "environment"]);
    expect(ids("idea")).toEqual(["tool", "idea", "why"]);
    expect(ids("story")).toEqual(["tool", "story", "better"]);
  });
});
