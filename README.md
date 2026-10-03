# xfina-ui

The shared look of the xfina.dev sites: the colours, light and dark mode, the header and footer, and every UI component, so the three sites read as one product.

| | What it is | Where |
|---|---|---|
| **Xfina** (flagship) | The statement parser, published as a library and with its own UI, which is versioned | [xfina.dev](https://xfina.dev) |
| **Xfina Labs** | Apps built on Xfina and Xfingine, starting with the Portfolio Engine; not versioned | [labs.xfina.dev](https://labs.xfina.dev) |
| **Xfingine** | The core engine library. It has no site; its help pages are on crates.io, npm and PyPI | [GitHub](https://github.com/xfina-dev/xfingine) |
| **Xfina Data** | Open datasets (FX and inflation, with more as needed) | [data.xfina.dev](https://data.xfina.dev) |

Other products, such as xsteer.in and sakthipriyan.com, use these libraries and datasets with their own UI. They do not use xfina-ui.

A site holds only how its pages are composed, in HTML or Vue templates, and its own logic. It defines no colour and no component of its own.

## What it provides

| File | What it is | How a page loads it |
|---|---|---|
| `dist/xfina-ui.css` | Colour tokens for light and dark, the page column (`.xf-container`), the body and the scrollbars | `<link rel="stylesheet">`, or `import` in a Vite app |
| `dist/xfina-theme.js` | Light/dark: follows the OS until the reader chooses, then remembers the choice across all xfina.dev sites | A classic `<script>` in `<head>`, with no `defer` |
| `dist/xfina-ui.js` | The `<xfina-header>` and `<xfina-footer>` elements | `<script defer>`, or a side-effect `import` |
| `dist/logo.svg` | The logo, for use as a favicon | `<link rel="icon">` |
| `dist/SHA256SUMS` | A hash of each file above | Used to verify a vendored copy |

No framework and no runtime dependencies. Both elements render into a shadow root, so neither Tailwind's preflight nor a site's own CSS can restyle them.

## Using it on a site

Copy `dist/` from a release tag into the site, for example to `vendor/xfina-ui/`, and check the copy against `SHA256SUMS`. Sites never load these files from another origin at runtime: a site's look changes only when that site upgrades, in its own pull request.

```html
<head>
  <link rel="icon" type="image/svg+xml" href="/vendor/xfina-ui/logo.svg">
  <link rel="stylesheet" href="/vendor/xfina-ui/xfina-ui.css">
  <script src="/vendor/xfina-ui/xfina-theme.js"></script>
  <script defer src="/vendor/xfina-ui/xfina-ui.js"></script>
</head>
<body>
  <main class="xf-container">
    <xfina-header site="data"></xfina-header>
    …
    <xfina-footer site="data"></xfina-footer>
  </main>
</body>
```

### `<xfina-header site="xfina | data | labs">`

| | |
|---|---|
| `site` | Required: `xfina`, `labs` or `data`. Sets the title, the tagline and the GitHub link, and leaves the site out of the switcher. Any other value throws an error, including `xfingine`, which has no site. |
| `home` | Where the logo and title link to. Defaults to `/`. |
| `heading` | Renders the title as `<h1>`. Use it on pages that have no other main heading. |
| `slot="context"` | The site's own picker, shown beside the title: a version on xfina.dev, an app on Labs, a dataset on Data. Use `<xfina-select>` (below), or shadcn's `Select` at `h-9`, which looks the same. |
| `slot="tagline"` | Replaces the site's default tagline. |
| `slot="actions"` | Extra buttons, placed before the privacy and theme buttons. |
| Switcher | `Xfina · Labs · Xfingine · Data`, without the current site, since the title already says where the reader is. The sites open in the same tab. Xfingine opens its GitHub repository in a new tab. |
| Other buttons | Building Wealth (sakthipriyan.com/building-wealth, new tab), the site's GitHub repository, privacy, and the theme toggle. |
| `xfina-privacy` event | Fired when the privacy button is pressed. A site that runs analytics calls `preventDefault()` and opens its own consent dialog. Otherwise a built-in dialog says that nothing is collected. |

### `<xfina-select label="…">`

The picker beside the title, drawn the way Labs and xfina.dev draw theirs with shadcn's `Select`: a 36px trigger, and a menu with a check mark on the chosen item. It works without Vue, so data.xfina.dev gets the same control.

```html
<xfina-select slot="context" label="App">
  <option value="all">All apps</option>
  <option value="portfolio" selected>Portfolio Engine</option>
</xfina-select>
```

| | |
|---|---|
| `<option>` / `<optgroup>` children | The choices, read once. An `<optgroup label>` is drawn as a labelled group, with separators between sections. `selected` (or the element's `value` attribute) sets the initial choice. |
| `label` | The accessible name, such as "App" or "Dataset". |
| `value` | The chosen option's value. Setting it to a value no option has throws an error. |
| `change` event | Fired when the reader picks a different option, with `detail.value`. What the choice does is up to the site. |

The keyboard follows the ARIA combobox pattern. Arrow keys, Enter or Space open the menu. In the open menu, the arrows, Home and End move the highlight, Enter or Space chooses, and Escape or Tab closes it.

### Components (`xf-*` classes)

Styling-only components, copying shadcn's. The same class works in plain HTML and in a Vue template, and replaces the shadcn component of the same name.

| Class | Replaces | Parts and variants |
|---|---|---|
| `xf-btn` | `Button` | `xf-btn-outline`, `-secondary`, `-ghost`, `-destructive`, `-link`; sizes `xf-btn-sm` (36px), `xf-btn-lg`, `xf-btn-icon` |
| `xf-segmented` | Labs' `Seg` | A row of `<button>`s; mark the chosen one `aria-pressed="true"` |
| `xf-card` | `Card` | `xf-card-header`, `-title`, `-description`, `-content`, `-footer` |
| `xf-input` | `Input` | `xf-input-sm` (36px) |
| `xf-label` | `Label` | |
| `xf-badge` | Labs' `Tag` | `xf-badge-good`, `-warning`, `-critical`, `-soon` (planned, dashed) |
| `xf-table` | `Table` | Style a plain `<table>` with its `thead`, `tbody`, `tfoot` and `caption` |
| `xf-pre`, `xf-prose` | | A code or request block; running text in a card |
| `xf-muted`, `xf-sr-only`, `xf-stack` | | Muted text, screen-reader-only text, and sections 32px apart |

### Charts (`XfinaUI.chart`)

| | |
|---|---|
| `series()` | The eight series colours as `rgb()`, in the order they are assigned |
| `ramp("seq" \| "div")` | Five steps for magnitude, or for change (fall, none, rise) |
| `colour("--token")` | Any token as `rgb()`. Throws if the token is not defined |
| `echarts()` | `{ color, textStyle, legend, tooltip, axis }` to spread into an ECharts option, so every chart has the same text, axes, legend and tooltip |

Read the colours at draw time, and again on `themechange`.

### Tokens

Every colour is an HSL triplet, as shadcn defines them, so any site uses it as `hsl(var(--name))`. Tailwind sites keep their existing `tailwind.config.js` colour mapping and remove their own `:root` and `.dark` blocks.

- **Interface:** shadcn zinc (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, …).
- **Charts:** `--chart-1` to `--chart-8`. Assign them in order. The order is what keeps neighbouring series apart for colour-blind readers.
- **Ramps:** `--seq-1..5` for magnitude, and `--div-1..5` for change (fall, none, rise).
- **Status:** `--status-good`, `--status-warning`, `--status-serious`, `--status-critical`. These mark a state, not a series, and always appear with an icon or a label. Text in a status colour uses its `-text` step, such as `--status-warning-text`, which reaches 4.5:1 where the status colour itself would not.

`themechange` is dispatched on `window`, with `detail.dark`, every time the theme changes, so a chart can redraw in the other palette.

## Development

```bash
npm install
npm run build    # src/ → dist/
npm test         # tokens, theme and elements, in jsdom
npm run check    # fails if dist/ is not what src/ builds
npm run demo     # gallery at http://localhost:4310
```

`dist/` is committed, because sites copy it from a tag. CI fails a pull request whose `dist/` does not match its `src/`.
