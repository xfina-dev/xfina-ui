// xfina-ui: the theme and every UI component of the xfina.dev sites.
//
// The shadcn-vue components are owned here, once. A site imports what it
// needs and keeps no copy of its own; if it needs a component this package
// does not have, the component is added here, for every site.

export * from "./components/ui/accordion";
export * from "./components/ui/badge";
export * from "./components/ui/button";
export * from "./components/ui/card";
export * from "./components/ui/copy-field";
export * from "./components/ui/dialog";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/segmented";
export * from "./components/ui/select";
export * from "./components/ui/table";
export * from "./components/ui/tooltip";

export { default as XfinaHeader } from "./components/xfina/XfinaHeader.vue";
export { default as XfinaFamily } from "./components/xfina/XfinaFamily.vue";
export { default as XfinaProvider } from "./components/xfina/XfinaProvider.vue";

export { FAMILY, SITES, USED_BY, siteFor } from "./family.js";
export { useXfinaTheme } from "./theme.js";
export * as chart from "./chart.js";
export { cn } from "./lib/utils.js";
