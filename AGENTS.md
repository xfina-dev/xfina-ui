# xfina-ui — Agent Context & Guidelines

xfina-ui is the theme and the UI components of the xfina.dev sites, published to npm as `xfina-ui`. Every site is Vue + Tailwind + Vite, and every site takes its look from this package, so three repositories read as one product.

- **Xfina** is the flagship: the statement parser, published as a library and with its own versioned UI at xfina.dev.
- **Xfina Labs**: unversioned apps at labs.xfina.dev, built on Xfina and Xfingine. The first is the Portfolio Engine.
- **Xfingine** is the core engine. It has no site, only its GitHub repository and its pages on crates.io, npm and PyPI. The switcher links to its repository, and it is never a `site` value.
- **Xfina Data**: open datasets at data.xfina.dev.

Other products, such as xsteer.in and sakthipriyan.com, use Xfina, Xfingine and the datasets with their own UI. This package is for the xfina.dev sites only, and no library may depend on it.

## What belongs here

**Every UI component.** A site holds only how its pages are composed (its Vue templates and page layout) and its own logic: what it fetches, computes and plots. A site defines no colour and no component of its own.

1. **Tokens.** Every colour, the radius and the font stacks, in `src/tokens.js`, written to `style.css` and mapped into Tailwind by the preset.
2. **Light and dark.** `src/theme-script.js` is the only code that decides the theme. The Vite plugin puts it in every page's `<head>`; `useXfinaTheme()` reads and toggles it.
3. **shadcn-vue components,** owned once in `src/components/ui/`. xfina and Labs delete their copies of `components/ui/` when they adopt this package. A site that needs a component this package lacks adds it here, for every site, and never builds it locally.
4. **The frame.** `XfinaHeader`, `XfinaFamily`, the page column and the logo.
5. **Chart styling,** in `src/chart.js`. A site's chart code decides what is plotted, never how it looks.

## Rules

6. **The components stay shadcn's.** They are shadcn-vue's source, on reka-ui, changed only where the family needs it. Keep them close to upstream so a later shadcn fix can be compared and taken in.
7. **Sites pin a published version.** A site depends on `xfina-ui` from npm at a version it chose, never a path or a git branch, so a change here reaches a site only when that site upgrades, in its own pull request. This is the same rule xfina-data follows for Xfina.
8. **Classes need the site's content path.** Tailwind lets a site's `content` replace a preset's, so each site lists `./node_modules/xfina-ui/dist/**/*.js` itself. Without it the components render unstyled. The README's setup shows it, and every port is checked in a browser.
9. **A palette change is validated before it merges.** Chart colours are checked for colour-blind separation and contrast against both surfaces (`#ffffff` and `#09090b`). Record the result in the comment above `chart` in `src/tokens.js`. The slot order is part of what is validated: never reorder the slots, or assign them out of order, without re-running the check. Status text tokens are held to 4.5:1 by a test.
10. **Errors, never silent fallbacks.** An unknown `site` throws. A missing theme script throws when a component needs it. A chart helper throws on a token that is not defined. None of them draws something that looks right but is wrong.
11. **Versioning.** A change any site would see on upgrade (a token value, a component's look) is a minor version while below 1.0. Renaming or removing a token, component, prop, slot or event is breaking, because sites depend on those names.

## Conventions

- **Comments explain why.** Name the failure mode being avoided. What the code does is already on the next line.
- **Single-commit pull requests,** amended and force-pushed. `main` changes only through a pull request, and the required check is `Web`.
- **CHANGELOG.md** gets an entry for every change to `src/`.
- **Releasing:** bump `version` in `package.json` in a PR, merge it, then tag `vX.Y.Z` on `main`. The Publish workflow stages it on npm; a maintainer approves it with 2FA, and only then can sites install it. Never give the trusted publisher direct-publish permission.

## Build

```bash
npm ci
npm run build
npm test
```

All three run in CI. `npm run demo` serves the gallery at http://localhost:4310.
