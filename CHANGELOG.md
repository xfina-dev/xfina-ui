# Changelog

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
