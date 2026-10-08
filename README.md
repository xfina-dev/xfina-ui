# xfina-ui

The theme and UI components of the xfina.dev sites, as one npm package: a Tailwind preset, light and dark mode shared across the sites, the shared header, and the shadcn-vue components every site uses. Each site imports what it needs and keeps no components of its own, so the three sites read as one product.

| | What it is | Where |
|---|---|---|
| **Xfina** (flagship) | The statement parser, published as a library and with its own UI, which is versioned | [xfina.dev](https://xfina.dev) |
| **Xfingine** | The core engine library. It has no site; its help pages are on crates.io, npm and PyPI | [GitHub](https://github.com/xfina-dev/xfingine) |
| **Xfina Data** | Open datasets (FX and inflation, with more as needed) | [data.xfina.dev](https://data.xfina.dev) |
| **Xfina Labs** | Apps built on Xfina and Xfingine, starting with the Portfolio Engine; not versioned | [labs.xfina.dev](https://labs.xfina.dev) |

Other products, such as xsteer.in and sakthipriyan.com, use these libraries and datasets with their own UI. They do not use xfina-ui.

## Setup on a site

Every site is Vue 3, Tailwind 3 and Vite.

```bash
npm install xfina-ui
```

```js
// vite.config.js: the plugin puts the theme script first in <head>, so
// light or dark is set before the first paint.
import vue from "@vitejs/plugin-vue";
import xfina from "xfina-ui/vite";
export default { plugins: [vue(), xfina()] };
```

```js
// tailwind.config.js: the preset brings every colour, the radius and dark
// mode. The last content path is required: Tailwind lets a site's `content`
// replace a preset's, and without it the components render unstyled.
import xfina from "xfina-ui/tailwind";
export default {
  presets: [xfina],
  content: ["./index.html", "./src/**/*.{vue,js}", "./node_modules/xfina-ui/dist/**/*.js"],
};
```

```js
// main.js
import "xfina-ui/style.css"; // the tokens, light and dark
import "./style.css";        // @tailwind base; @tailwind components; @tailwind utilities;
```

```vue
<!-- App.vue: once, around everything -->
<XfinaProvider>…</XfinaProvider>
```

`XfinaProvider` keeps the page still when a Select or Dialog opens: reka-ui would otherwise pad the page by the scrollbar's width on top of the space `style.css` already reserves for it, shifting everything left. It also provides the timing every `Tooltip` needs.

A site defines no colours: delete any `:root` / `.dark` token blocks and any copy of shadcn's `components/ui/`.

## What it provides

```vue
<script setup>
import { XfinaProvider, XfinaHeader, Button, Card, CardHeader, CardTitle, CardContent } from "xfina-ui";
</script>

<template>
  <XfinaProvider>
    <main class="xf-container space-y-8">
      <XfinaHeader site="data" heading />
      <Card>
        <CardHeader><CardTitle>USD/INR</CardTitle></CardHeader>
        <CardContent><Button size="sm">Download CSV</Button></CardContent>
      </Card>
    </main>
  </XfinaProvider>
</template>
```

### Components

shadcn-vue's, on reka-ui, owned here once: **Accordion, Button, Card, Dialog, Input, Label, Popover, Select, Table, Tooltip**, with the same parts and props as shadcn. Also:

| | |
|---|---|
| `Button variant="selected"` | The family's "chosen" state (an added item, a picked filter): a primary outline on a faint tint, never a filled primary, which glares in dark mode |
| `ColorPicker` | A theme colour picked from a swatch, such as each asset's colour in a table. `v-model` is a token name (`'chart-3'`); `colors` the token names on offer (default every chart slot, shown in rows around the colour wheel: reds to yellow, greens to sky, blues to violets, purples to pinks); `used` maps a token to who already uses it (`{ 'chart-1': 'Nifty 50' }`, leaving out the item's own), marked with a dot and named in its tooltip and accessible name ("Colour 3, used by Gold", numbered by place in the picker); `label` names what is coloured ("Colour for Gold"). Any number of colours; `columns` sets the grid's width, and by default it is as near a square as the set allows (⌈√n⌉ wide, so the 16 chart slots are 4×4 and 8 colours 3×3 with a gap). Arrow keys move, Enter or Space picks, Escape closes. A value outside `colors`, a token that is not defined, or a `columns` that is not a whole number from 1, throws |
| `CopyField` | A value joined to its copy button: `value`, optional `href` (makes the value a link), `label` (for "Copy URL"). One button width for "Copy" and "Copied"; a copy is confirmed with a check, as `selected` draws it |
| `Badge` | `variant`: `default`, `good`, `warning`, `critical`, or `soon` (planned, dashed). Status text stays readable at 4.5:1 |
| `Segmented` | One choice of a few: `v-model`, `options` (strings or `{ value, label }`), `label`, `disabled`. The chosen one is drawn as `selected` is |
| `cn()` | shadcn's class merger, for composing classes |

### `XfinaHeader`

| | |
|---|---|
| `site` | Required: `xfina`, `labs` or `data`. Sets the title, tagline and GitHub link. Any other value throws, including `xfingine`, which has no site |
| `home` | Where the logo and title link to. Defaults to `/` |
| `heading` | Renders the title as `<h1>`, for a page with no other main heading |
| `own-privacy` + `@privacy` | For a site that runs analytics: the privacy button emits `privacy` and the site opens its own consent dialog. Otherwise a built-in dialog says nothing is collected |
| `#context` | The site's picker beside the title: version on Xfina, app on Labs, dataset on Data |
| `#tagline`, `#actions` | Replace the tagline; add buttons before privacy and theme |

The switcher lists the rest of the family (`Xfina · Xfingine · Data · Labs`, without the current site), followed by the site's GitHub repository, privacy and the theme toggle. Xfingine opens its GitHub repository in a new tab. Products built on the family are not in the header; they are in `XfinaFamily`'s "Used by" row.

### `XfinaFamily`

One card per member of the family, as xsteer.in shows its projects; pass `site` to mark the current one. Below them, set apart and smaller, **Used by**: the products built on the family (Building Wealth, on Xfina Data and moving to Xfina and Xfingine; Xsteer, The Personal Finance OS, on Xfina, Xfingine and Xfina Data), from `USED_BY`. They have their own brands, so they are not drawn as members.

### Theme and charts

| | |
|---|---|
| `useXfinaTheme()` | `{ isDark, toggle }`. The choice is a cookie on xfina.dev, so it holds on every subdomain |
| `chart.series()` | The sixteen series colours as `rgb()`, in the order they are assigned |
| `chart.ramp("seq" \| "div")` | Five steps for magnitude, or for change (fall, none, rise) |
| `chart.echarts()` | `{ color, textStyle, legend, tooltip, axis }` to spread into an ECharts option |

Read chart colours at draw time and again on the `themechange` window event.

### Tokens

Colours are HSL triplets, used through the preset (`bg-primary`, `text-muted-foreground`, `bg-chart-1`, `text-status-warning-text`, with opacity such as `bg-primary/10`) or directly as `hsl(var(--name))`.

- **Interface:** shadcn zinc, except `primary`, which is the brand blue from the logo (white text in both modes). Blue used as text takes `primary-text`, which stays readable on the dark surface.
- **Charts:** `chart-1` … `chart-16`. Assign them in order: the order keeps neighbouring series apart for colour-blind readers. Past eight series, some that are not neighbours look alike (no sixteen colours all stay apart), so a chart with more than eight names every series with a legend and direct labels or a table, never by colour alone. `ColorPicker` shows them grouped by hue instead, so a reader finds the colour they want; a site still gives its items their defaults in slot order, and the picker is for a reader choosing another.
- **Ramps:** `seq-1..5` for magnitude, `div-1..5` for change.
- **Status:** `status-good`, `-warning`, `-serious`, `-critical`, each with a `-text` step for text. They mark a state, never a series.

`.xf-container` is the page column: 72rem of content with 32px padding outside it, and a 16px gutter on a phone.

## Development

```bash
npm install
npm run demo     # the gallery, from source, at http://localhost:4310
npm test         # components, preset, theme and tokens
npm run build    # dist/: the components, style.css, the preset and the Vite plugin
```

Releases are tagged `vX.Y.Z` on `main`; the Publish workflow puts that version on npm with provenance.
