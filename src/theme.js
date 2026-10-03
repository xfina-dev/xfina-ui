// Light or dark in a component. The decision itself is made by the theme
// script that xfina-ui/vite puts in every page's <head> (theme-script.js), so
// the class is set before the first paint. This reads and changes it.

import { onBeforeUnmount, onMounted, readonly, ref } from "vue";

export function useXfinaTheme() {
  const theme = typeof window !== "undefined" ? window.xfinaTheme : undefined;
  const isDark = ref(theme ? theme.isDark() : false);
  const follow = (event) => (isDark.value = event.detail.dark);

  onMounted(() => {
    if (!window.xfinaTheme) {
      throw new Error("xfina-ui: the theme script is not on this page; add xfina() from xfina-ui/vite to vite.config");
    }
    isDark.value = window.xfinaTheme.isDark();
    window.addEventListener("themechange", follow);
  });
  onBeforeUnmount(() => window.removeEventListener("themechange", follow));

  return { isDark: readonly(isDark), toggle: () => window.xfinaTheme.toggle() };
}
