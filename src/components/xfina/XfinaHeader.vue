<script setup>
// The header every xfina.dev site draws: logo, title, the site's own picker,
// tagline, the switcher to the rest of the family, Building Wealth, the
// repository, privacy and the theme toggle.
//
// From 1024px the buttons share the title's line and the tagline runs the
// full width beneath both. Beside the title and tagline together they left
// the tagline under 480px, wrapped to four lines. Narrower, they move to a
// row of their own under the tagline. At 1024px the column holds the logo,
// the widest title with its picker (xfina.dev's version picker and commit
// hash, ~330px) and the ~480px of buttons.
import { computed, ref } from "vue";
import { Activity, Github, Moon, Sun } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AUTHOR, FAMILY, siteFor } from "@/family.js";
import { useXfinaTheme } from "@/theme.js";
import logo from "@/logo.svg?raw";

const props = defineProps({
  site: { type: String, required: true },
  // Where the logo and title link to.
  home: { type: String, default: "/" },
  // The title as the page's <h1>, for a page with no other main heading.
  heading: { type: Boolean, default: false },
  // A site that runs analytics opens its own consent dialog on @privacy.
  // Every other site gets the built-in one, which says nothing is collected.
  ownPrivacy: { type: Boolean, default: false },
});
const emit = defineEmits(["privacy"]);

// Checked now, so an unknown site fails as the page is built, not later.
siteFor(props.site);
const site = computed(() => siteFor(props.site));
// The current site is left out: the title already says where the reader is.
const others = computed(() => FAMILY.filter((m) => m.id !== props.site));
const host = computed(() => new URL(site.value.url).host);

const { isDark, toggle } = useXfinaTheme();
const privacyOpen = ref(false);
function privacy() {
  if (props.ownPrivacy) emit("privacy");
  else privacyOpen.value = true;
}
</script>

<template>
  <header class="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-5 lg:grid-cols-[64px_minmax(0,1fr)_auto] lg:gap-x-6">
    <a :href="home" :aria-label="`${site.title} home`" class="col-start-1 row-span-2 row-start-1 shrink-0 leading-none transition-opacity hover:opacity-80">
      <span class="block h-16 w-16 [&>svg]:h-16 [&>svg]:w-16" v-html="logo" />
    </a>

    <div class="col-start-2 row-start-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <a :href="home" class="no-underline transition-colors hover:text-primary">
        <component :is="heading ? 'h1' : 'span'" class="block whitespace-nowrap text-3xl font-bold tracking-tight">
          {{ site.title }}
        </component>
      </a>
      <slot name="context" />
    </div>

    <p class="col-start-2 row-start-2 mt-2 leading-relaxed text-muted-foreground lg:col-span-2">
      <slot name="tagline"><span v-html="site.tagline" /></slot>
    </p>

    <nav
      aria-label="Xfina sites and links"
      class="col-span-2 row-start-3 mt-4 flex flex-wrap items-center gap-3 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:flex-nowrap"
    >
      <div class="inline-flex">
        <Button
          v-for="(m, i) in others"
          :key="m.id"
          as="a"
          :href="m.url"
          variant="outline"
          size="sm"
          :target="m.external ? '_blank' : undefined"
          :rel="m.external ? 'noopener noreferrer' : undefined"
          class="rounded-none shadow-sm focus-visible:relative"
          :class="[i === 0 ? 'rounded-l-md' : '-ml-px', i === others.length - 1 && 'rounded-r-md']"
        >
          {{ m.label }}<span v-if="m.external" class="sr-only"> (GitHub, opens in a new tab)</span>
        </Button>
      </div>
      <Button as="a" :href="AUTHOR.url" target="_blank" rel="noopener noreferrer" variant="outline" size="sm" class="shadow-sm">
        {{ AUTHOR.label }}
      </Button>
      <Button
        as="a"
        :href="`https://github.com/${site.repo}`"
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        size="icon-sm"
        class="shadow-sm"
        title="GitHub repository"
      >
        <Github class="!size-[1.2rem]" /><span class="sr-only">GitHub repository</span>
      </Button>
      <slot name="actions" />
      <Button variant="outline" size="icon-sm" class="shadow-sm" title="Privacy &amp; analytics" @click="privacy">
        <Activity class="!size-[1.2rem]" /><span class="sr-only">Privacy &amp; analytics</span>
      </Button>
      <Button variant="outline" size="icon-sm" class="shadow-sm" title="Toggle theme" @click="toggle">
        <Sun v-if="isDark" class="!size-[1.2rem]" />
        <Moon v-else class="!size-[1.2rem]" />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </nav>

    <Dialog v-model:open="privacyOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy &amp; analytics</DialogTitle>
          <DialogDescription>
            {{ host }} runs no analytics: no tracking script, no tracking cookie, and nothing about your visit is sent
            anywhere by this page.
          </DialogDescription>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">Cloudflare, which serves the site, sees each request the way any web server does.</p>
        <p class="text-sm text-muted-foreground">
          The one cookie is <code>xfina-theme</code> on xfina.dev, which remembers whether you chose light or dark.
        </p>
      </DialogContent>
    </Dialog>
  </header>
</template>
