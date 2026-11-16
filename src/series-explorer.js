// SeriesExplorer, on its own entry point: `xfina-ui/series-explorer`.
//
// It is the one component that needs ECharts, and ECharts is an optional peer
// dependency. Were it on the main barrel, every consumer's bundler would have
// to resolve `echarts/charts` and the rest while building `dist/index.js`,
// even a site that mounts no explorer: the explorer's ECharts module is
// imported dynamically, so it is fetched only when an explorer mounts, but its
// own imports are static, and a bundler resolves those at build time. Labs
// found this out by upgrading: eleven MISSING_EXPORT errors against Vite's
// optional-peer stub, cleared only by installing a library it does not use.
//
// On its own subpath, a site that imports nothing from here never names
// ECharts, and a site that does installs it. That is what makes the peer
// dependency optional in fact and not only in the README.
export { SeriesExplorer, rowsFromCsv } from "./components/ui/series-explorer/index.js";
