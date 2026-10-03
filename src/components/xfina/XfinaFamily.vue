<script setup>
// The family, one card per member, as xsteer.in shows the projects it is
// built on; then the products built on it. Those are shown apart and smaller:
// they have their own brands, and must not read as Xfina products. The
// current site's card says so and does not link to itself.
import { Badge } from "@/components/ui/badge";
import { FAMILY, USED_BY } from "@/family.js";

defineProps({
  // The site this is shown on, if any.
  site: { type: String, default: undefined },
});

const titleOf = (id) => FAMILY.find((m) => m.id === id).title;
// "Xfina", "Xfina and Xfingine", "Xfina, Xfingine and Xfina Data".
const builtOn = (uses) => {
  const names = uses.map(titleOf);
  return names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};
const host = (url) => new URL(url).host;
</script>

<template>
  <section aria-labelledby="xfina-family-title" class="space-y-10">
    <div>
      <div class="max-w-2xl">
        <h2 id="xfina-family-title" class="text-2xl font-semibold tracking-tight">
          <slot name="title">The Xfina family</slot>
        </h2>
        <p class="mt-3 leading-relaxed text-muted-foreground">
          <slot>
            Open source tools for Indian personal finance. Each is a separate Apache-2.0 repository you can audit, fork
            or run yourself, and the libraries are published for other products to build on.
          </slot>
        </p>
      </div>
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <component
          :is="m.id === site ? 'div' : 'a'"
          v-for="m in FAMILY"
          :key="m.id"
          :href="m.id === site ? undefined : m.url"
          :target="m.external ? '_blank' : undefined"
          :rel="m.external ? 'noopener noreferrer' : undefined"
          :aria-current="m.id === site ? 'page' : undefined"
          class="group rounded-lg border bg-card p-6 text-card-foreground no-underline transition-colors"
          :class="m.id === site ? 'border-primary bg-primary/5' : 'hover:border-primary/40'"
        >
          <h3 class="font-semibold tracking-tight transition-colors group-hover:text-primary">
            {{ m.title }}
            <span v-if="m.id === site" class="ml-1 text-xs font-medium text-muted-foreground">· this site</span>
          </h3>
          <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ m.role }}</p>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">{{ m.about }}</p>
        </component>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Used by</h3>
      <div class="mt-4 grid gap-6 sm:grid-cols-2">
        <a
          v-for="p in USED_BY"
          :key="p.id"
          :href="p.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col rounded-lg border border-dashed p-5 no-underline transition-colors hover:border-primary/40"
        >
          <span class="flex items-baseline justify-between gap-3">
            <span class="font-semibold tracking-tight transition-colors group-hover:text-primary">{{ p.title }}</span>
            <span class="truncate text-xs text-muted-foreground">{{ host(p.url) }}</span>
          </span>
          <span class="mt-1 flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ p.role }}</span>
            <Badge v-if="p.status">{{ p.status }}</Badge>
          </span>
          <span class="mt-3 text-sm leading-relaxed text-muted-foreground">{{ p.about }}</span>
          <span class="mt-3 text-xs text-muted-foreground">Built on <span class="font-medium text-foreground">{{ builtOn(p.uses) }}</span></span>
        </a>
      </div>
    </div>
  </section>
</template>
