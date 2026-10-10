# Changelog

## 0.8.0

- **`Segmented`:** `size` (`sm`, `default`, `lg`) and `variant` (`default`, `primary`). Each size is as tall overall as the Button it lines up with: 32px, 36px (Button `sm`) and 44px (Button `lg`). `variant="primary"` fills the chosen option as a default Button, inside a padded group, for a switch that changes everything below it and must stand out as much as the page's main button: Labs' Nominal | Real, which Labs had built by hand from Buttons. The defaults draw exactly what 0.7 drew. An unknown size or variant throws.

## 0.7.1

- **`Table`:** `container-class` styles the scrolling wrapper around the `<table>`, which `class` could not reach. In a fixed-height box the wrapper grew to the whole table and never scrolled, so a `sticky top-0` header scrolled away with the rows (Labs measured a 12,662px wrapper in a 343px box). `<Table container-class="h-full">` gives the wrapper the box's height, and the header stays put. The demo has a long table with a sticky header.
- **`ColorPicker`:** a chart colour is announced by its slot, wherever the hue grouping puts it: `chart-1` is "Colour 1", not "Colour 9" (its place in the grid). Numbering by place contradicted the token and "assign colours in slot order". Tokens other than the chart slots are still numbered by their place in `colors`.

## 0.7.0

- **`ColorPicker`:** a theme colour picked from a swatch, for Labs' Allocation table and any site that lets a reader colour an item. A swatch button opens a 4×4 grid of the sixteen chart colours, grouped by hue (reds to yellow, greens to sky, blues to violets, purples to pinks) so a reader finds the colour they want; charts still assign them in slot order; `v-model` is the token name, so the colour follows light and dark. The chosen colour has a check, and colours other items use (`used`) a dot, with who uses them in the tooltip and the swatch's name ("Colour 3, used by Gold"). The grid is a radiogroup with one tab stop: arrow keys move without recolouring anything behind the popover, Enter or Space picks, Escape closes. The marks are drawn in the popover's colours, so they read on every slot in both modes. `colors` offers another set, of any size, and `columns` sets the grid's width; by default it is as near a square as the set allows (⌈√n⌉ wide). A value outside the set, an undefined token, or a width that is not a whole number from 1, throws.
- **Sixteen chart colours:** `chart-9` … `chart-16` follow the eight there were, which are unchanged, so Labs can colour a portfolio of more than eight assets. Validated in slot order on both surfaces: worst neighbouring pair CVD ΔE 9.1 light / 8.4 dark, normal-vision ΔE 19.6 / 17.3, and the new slots are all at 3:1 or more. Sixteen colours cannot all stay apart: past eight series some pairs that are not neighbours look alike (slots 11 and 16 are the closest), so a chart with more than eight names each series with labels or a table. `chart.series()` returns all sixteen.
- **`Popover`:** shadcn-vue's, on reka-ui: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`.

## 0.6.1

- **`XfinaFamily`:** a rule above "The Xfina family", in the border colour. Sites place the family at the foot of every page, straight after their own content, and without a rule it read as more of that page.

## 0.6.0

- **`CopyField`:** a value and its copy button joined into one control, such as a dataset's URL. The button keeps one width whether it says "Copy" or "Copied", so nothing shifts, and confirms a copy the way an added item is marked: a check, a primary outline and a faint tint. A refused clipboard shows "Failed" rather than claiming a copy. The value can be a link.

## 0.5.0

- **Family order:** Xfina, Xfingine, Xfina Data, Xfina Labs: the flagship, then the engine, the data and the apps built on them. The header's switcher follows the same order.
- **Header:** the Building Wealth button is gone. The header is the family's own navigation (switcher, repository, privacy, theme); Building Wealth and Xsteer are both in the family cards' "Used by" row, side by side. `AUTHOR` is no longer exported.
- **Used by:** Building Wealth first, then Xsteer. Building Wealth's card describes the writing and its tools, names RealValue Portfolio in the description, links to Building Wealth itself, and says its calculations are moving to Xfina and Xfingine (`planned` in `USED_BY`).
- **Brand blue as primary:** `--primary` is the logo's blue (`#4457d9` light, `#5163de` dark) with white text, in place of shadcn zinc's near-black and near-white. A default button no longer glares in dark mode or sits black in light mode, and selections, the default badge and links are blue. A new `--primary-text` step (`#7d8cf2` in dark mode) keeps blue text at 4.5:1 or more, held by a test.
- **Segmented:** a chosen first or last option's outline now closes at the corners. It was square and cut off by the group's rounded corner.

## 0.4.0

xfina-ui is now a Vue library, published to npm as `xfina-ui`, and every xfina.dev site is Vue + Tailwind + Vite. This replaces the framework-free elements of 0.1–0.2 (`<xfina-header>`, `<xfina-select>`, `<xfina-footer>`); data.xfina.dev stays on 0.2.0 until its Vue version ships.

- **Components:** shadcn-vue's Accordion, Button, Card, Dialog, Input, Label, Select, Table and Tooltip, owned here once, plus `Badge` and `Segmented` from Labs. xfina and Labs delete their copies of `components/ui/` as they adopt these.
- **`XfinaHeader`:** the shared header, with the same layout, switcher, Building Wealth link, privacy and theme buttons as 0.2, now drawn with the shadcn components.
- **`XfinaProvider`:** wraps a site's app once. Opening a Select or Dialog no longer shifts the page by the scrollbar's width, and tooltips get their timing.
- **`XfinaFamily`:** one card per member of the family, as xsteer.in shows its projects, then a "Used by" row for the products built on it: Xsteer, The Personal Finance OS, in active development (on Xfina, Xfingine and Xfina Data), and Building Wealth's RealValue Portfolio (on Xfina Data). It replaces the footer, which repeated the header.
- **Selected state:** `Button variant="selected"` and `Segmented`'s chosen option use a primary outline on a faint tint, as Labs' Portfolio Engine marks an added item. A filled primary is a near-white block in dark mode.
- **Tailwind preset** (`xfina-ui/tailwind`): every token as a colour with opacity modifiers, the radius, dark mode, and the base styles shadcn puts in each site's stylesheet.
- **Vite plugin** (`xfina-ui/vite`): puts the theme script first in `<head>`. `useXfinaTheme()` reads and toggles it.
- **Charts:** `chart.series()`, `chart.ramp()`, `chart.colour()` and `chart.echarts()`.
- **Status text tokens:** `--status-*-text`, readable at 4.5:1 as small text on a status tint in both modes. Warning text was 1.7:1 on white.

## 0.2.0

- `<xfina-select>` reads `<optgroup>`: each group gets a label, and separators divide the sections, as shadcn's Select draws them. For data.xfina.dev's dataset picker, grouped as its index is.
- The body's line height is 1.5, as Tailwind's preflight sets it on xfina.dev and Labs, so a site without Tailwind sets text the same way.

## 0.1.0 (2026-10-03)

- First release: tokens (shadcn zinc, eight chart slots, sequential and diverging ramps, status), the light/dark theme shared across xfina.dev subdomains, `<xfina-header>` with an `Xfina · Labs · Xfingine · Data` switcher (without the current site) and a Building Wealth link, `<xfina-footer>`, the page column, `<xfina-select>` for the picker beside the title, and the logo.
