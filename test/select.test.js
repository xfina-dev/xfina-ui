// <xfina-select>: the picker beside a site's title, which behaves like the
// shadcn Select that Labs and xfina.dev use.

import { test } from "node:test";
import assert from "node:assert/strict";
import { page } from "./helpers.js";

const MARKUP = `
  <xfina-select label="App">
    <option value="all">All apps</option>
    <option value="portfolio" selected>Portfolio Engine</option>
    <option value="emi">EMI Planner</option>
  </xfina-select>`;

function mount(markup = MARKUP) {
  const p = page({ body: markup });
  p.theme();
  p.ui();
  const element = p.window.document.querySelector("xfina-select");
  const root = element.shadowRoot;
  const trigger = root.querySelector(".trigger");
  const list = root.querySelector('[role="listbox"]');
  const press = (key) => trigger.dispatchEvent(new p.window.KeyboardEvent("keydown", { key, bubbles: true }));
  const changes = [];
  element.addEventListener("change", (event) => changes.push(event.detail.value));
  return { p, element, root, trigger, list, press, changes };
}

test("the trigger names the selected option and the menu starts closed", () => {
  const { element, root, trigger, list } = mount();
  assert.equal(element.value, "portfolio");
  assert.equal(root.querySelector(".value").textContent, "Portfolio Engine");
  assert.equal(trigger.getAttribute("aria-label"), "App");
  assert.equal(list.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  const ticked = [...root.querySelectorAll('[role="option"][aria-selected="true"]')].map((o) => o.textContent);
  assert.deepEqual(ticked, ["Portfolio Engine"]);
});

test("a click opens the menu and a click on an option chooses it", () => {
  const { element, root, trigger, list, changes } = mount();
  trigger.click();
  assert.equal(list.hidden, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  root.querySelectorAll('[role="option"]')[2].click();
  assert.equal(list.hidden, true);
  assert.equal(element.value, "emi");
  assert.equal(root.querySelector(".value").textContent, "EMI Planner");
  assert.deepEqual(changes, ["emi"]);
});

test("the keyboard opens, moves, chooses and closes", () => {
  const { element, trigger, list, press, changes } = mount();
  press("ArrowDown");
  assert.equal(list.hidden, false, "ArrowDown opens");
  assert.match(trigger.getAttribute("aria-activedescendant"), /-1$/, "the highlight starts on the chosen option");
  press("ArrowDown");
  press("ArrowDown");
  assert.match(trigger.getAttribute("aria-activedescendant"), /-2$/, "the highlight stops at the last option");
  press("Home");
  press("Enter");
  assert.equal(list.hidden, true);
  assert.equal(element.value, "all");
  assert.deepEqual(changes, ["all"]);

  press(" ");
  assert.equal(list.hidden, false, "Space opens");
  press("Escape");
  assert.equal(list.hidden, true, "Escape closes");
  assert.equal(element.value, "all", "and changes nothing");
});

test("choosing the option already chosen fires no change", () => {
  const { root, trigger, changes } = mount();
  trigger.click();
  root.querySelectorAll('[role="option"]')[1].click();
  assert.deepEqual(changes, []);
});

test("a press outside closes the menu", () => {
  const { p, trigger, list } = mount();
  trigger.click();
  p.window.document.body.dispatchEvent(new p.window.Event("pointerdown", { bubbles: true, composed: true }));
  assert.equal(list.hidden, true);
});

test("setting value moves the tick; a value no option has throws", () => {
  const { element, root, changes } = mount();
  element.value = "emi";
  assert.equal(root.querySelector(".value").textContent, "EMI Planner");
  assert.deepEqual(changes, [], "a value set by the page is not the reader's choice");
  assert.throws(() => (element.value = "backtest"), /no option has the value "backtest"/);
});

test("the value attribute picks the initial option, and must name one", () => {
  const { element } = mount('<xfina-select value="emi"><option value="all">All</option><option value="emi">EMI</option></xfina-select>');
  assert.equal(element.value, "emi");

  const p = page({ body: "" });
  p.ui();
  const bad = p.window.document.createElement("xfina-select");
  bad.setAttribute("value", "nope");
  bad.innerHTML = '<option value="all">All</option>';
  assert.throws(() => bad.connectedCallback(), /no option has the value "nope"/);
});

test("a select with no options fails loudly", () => {
  const p = page({ body: "" });
  p.ui();
  const empty = p.window.document.createElement("xfina-select");
  assert.throws(() => empty.connectedCallback(), /needs at least one <option>/);
});

test("option groups are labelled, divided, and move as one list", () => {
  const { element, root, trigger, press, changes } = mount(`
    <xfina-select label="Dataset" value="/">
      <option value="/">All datasets</option>
      <optgroup label="USD/INR Rates">
        <option value="/datasets/sbi/">SBI forex card</option>
        <option value="/datasets/bis/">BIS USD/INR</option>
      </optgroup>
      <optgroup label="Inflation">
        <option value="/datasets/cpi/">MoSPI CPI</option>
      </optgroup>
    </xfina-select>`);
  const groups = [...root.querySelectorAll('[role="group"]')].map((g) => [
    g.querySelector(".group-label").textContent,
    [...g.querySelectorAll('[role="option"]')].map((o) => o.textContent),
  ]);
  assert.deepEqual(groups, [
    ["USD/INR Rates", ["SBI forex card", "BIS USD/INR"]],
    ["Inflation", ["MoSPI CPI"]],
  ]);
  for (const group of root.querySelectorAll('[role="group"]')) {
    assert.equal(root.getElementById(group.getAttribute("aria-labelledby")).textContent, group.firstChild.textContent);
  }
  assert.equal(root.querySelectorAll(".separator").length, 2, "between All datasets and each group");

  press("ArrowDown");
  press("ArrowDown");
  press("ArrowDown");
  press("ArrowDown");
  press("Enter");
  assert.equal(element.value, "/datasets/cpi/", "the arrows cross from one group into the next");
  assert.deepEqual(changes, ["/datasets/cpi/"]);
  assert.equal(root.querySelector(".value").textContent, "MoSPI CPI");
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
});
