# Changelog

## 0.3.0

- **Components:** `xf-*` classes copying shadcn's Button, Card, Input, Label and Table, plus Labs' segmented control and badge, with `xf-pre`, `xf-prose` and a few utilities. They replace the copies of shadcn's `components/ui/` in xfina and Labs; Data uses them in place of its own CSS.
- **Charts:** `XfinaUI.chart` gives series colours, ramps, any token as `rgb()`, and ECharts option fragments (text, axes, legend, tooltip), so charts on every site look the same.
- **Status text tokens:** `--status-*-text`, which reach 4.5:1 as small text on a status tint in both modes. Warning text was 1.7:1 on white.
- **Base:** `box-sizing: border-box` everywhere, and code in the mono stack, as Tailwind's preflight sets them on xfina and Labs.

## 0.2.0

- `<xfina-select>` reads `<optgroup>`: each group gets a label, and separators divide the sections, as shadcn's Select draws them. For data.xfina.dev's dataset picker, grouped as its index is.
- The body's line height is 1.5, as Tailwind's preflight sets it on xfina.dev and Labs, so a site without Tailwind sets text the same way.

## 0.1.0 (2026-10-03)

- First release: tokens (shadcn zinc, eight chart slots, sequential and diverging ramps, status), the light/dark theme shared across xfina.dev subdomains, `<xfina-header>` with an `Xfina · Labs · Xfingine · Data` switcher (without the current site) and a Building Wealth link, `<xfina-footer>`, the page column, `<xfina-select>` for the picker beside the title, and the logo.
