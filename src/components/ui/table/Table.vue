<script setup>
import { cn } from "@/lib/utils";

const props = defineProps({
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
  // Not shadcn's: classes for the scrolling wrapper, which `class` cannot
  // reach. The wrapper is the sticky header's scroll container, so a table
  // in a fixed-height box needs the wrapper to have the height ("h-full",
  // "max-h-96"). Without it the wrapper grows to the whole table, never
  // scrolls, and a `sticky top-0` header scrolls away with the rows.
  containerClass: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
});
</script>

<template>
  <div :class="cn('relative w-full overflow-auto', props.containerClass)">
    <table :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>
