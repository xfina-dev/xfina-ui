// @vitest-environment node
// FeedbackCard rendered as vite-ssg renders data.xfina.dev's pages: in Node,
// with no location or localStorage.

import { describe, expect, test } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { FeedbackCard } from "@/index.js";

const DATA = { product: "Xfina Data", repo: "https://github.com/xfina-dev/xfina-data", storageKey: "xfina_data_feedback" };
const query = (href) => Object.fromEntries(new URL(href.replaceAll("&amp;", "&")).searchParams);

describe("FeedbackCard on the server", () => {
  test("renders unanswered, with links that need no browser", async () => {
    expect(typeof location).toBe("undefined");
    expect(typeof localStorage).toBe("undefined");
    const html = await renderToString(createSSRApp({ render: () => h(FeedbackCard, DATA) }));
    expect(html).toContain("Xfina Data · Feedback");
    expect(html).toContain("How was Xfina Data for you?");
    expect([...html.matchAll(/aria-pressed="(\w+)"/g)].map((m) => m[1])).toEqual(["false", "false"]);
    const problem = html.match(/href="([^"]*template=problem\.yml[^"]*)"/)[1];
    // The page and browser are filled in once mounted, in the browser.
    expect(query(problem)).toEqual({ template: "problem.yml", tool: "Xfina Data" });
  });
});
