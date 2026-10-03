# xfina-ui — Agent Context & Guidelines

xfina-ui is the shared look of the xfina.dev sites. It exists so that three repositories, built three different ways, still read as one product.

- **Xfina** is the flagship: the statement parser, published as a library and with its own versioned UI at xfina.dev.
- **Xfina Labs**: unversioned apps at labs.xfina.dev, built on Xfina and Xfingine. The first is the Portfolio Engine.
- **Xfingine** is the core engine. It has no site, only its GitHub repository and its pages on crates.io, npm and PyPI. The switcher links to its repository, and it is never a `site` value.
- **Xfina Data**: open datasets at data.xfina.dev.

Other products, such as xsteer.in and sakthipriyan.com, use Xfina, Xfingine and the datasets with their own UI. xfina-ui is for the xfina.dev sites only, and no library may depend on it.

## What belongs here

Only what must be identical on every xfina.dev site:

1. **Tokens.** Every colour, the radius and the font stacks, in `src/tokens.js`. A site never defines a colour of its own: if it needs one, the colour is added here, for every site.
2. **Light and dark.** `src/xfina-theme.js` is the only code that decides the theme.
3. **The frame.** The header, the footer, the page column and the logo.

A site's own components stay in that site's repository: tables, charts, dialogs, buttons inside its pages. Moving a component here means every site must render it the same way, so do it only when that is true.

## Rules

4. **No framework, no runtime dependencies.** One site is static HTML built by a Rust tool and two are Vue apps. Plain custom elements and CSS work in all three, and keep working when any of them changes stack.
5. **Shadow DOM for the elements.** Tailwind's preflight and each site's CSS would otherwise restyle the header differently on every site, which is the drift this repo exists to stop. Colours still come from the page's tokens, because custom properties reach into a shadow root.
6. **Sites vendor a tagged release; nothing is loaded across origins.** A site copies `dist/` at a tag and checks it against `SHA256SUMS`. A change here reaches a site only when that site upgrades, in its own pull request, so no release can silently change a live site.
7. **`dist/` is built, never edited.** `npm run build` writes it from `src/`, and CI fails a pull request whose `dist/` differs from what `src/` builds.
8. **A palette change is validated before it merges.** Chart colours are checked for colour-blind separation and contrast against both surfaces (`#ffffff` and `#09090b`). Record the result in the comment above `chart` in `src/tokens.js`. The slot order is part of what is validated: never reorder the slots, or assign them out of order, without re-running the check.
9. **Errors, never silent fallbacks.** An unknown `site` throws. A missing theme script is reported in the console and its toggle hidden. Neither draws a header that looks right but is wrong.
10. **Versioning.** A change any site would see on upgrade (a token value, the header layout) is a minor version while below 1.0. Renaming or removing a token, slot, attribute or event is breaking, because sites depend on those names.

## Conventions

- **Comments explain why.** Name the failure mode being avoided. What the code does is already on the next line.
- **Single-commit pull requests,** amended and force-pushed. `main` changes only through a pull request.
- **CHANGELOG.md** gets an entry for every change to `src/`.

## Build

```bash
npm ci
npm run check
npm test
```

Both are CI gates.
