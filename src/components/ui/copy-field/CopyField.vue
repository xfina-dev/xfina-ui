<script setup>
// A value with its copy button, joined into one control: the dataset URL on
// data.xfina.dev, and anything else a reader is meant to paste somewhere.
//
// The button keeps one width whatever it says ("Copy" or "Copied"), so the
// control never jumps. A copy is confirmed the way an added item is: a check
// mark, a primary outline and a faint tint, as Button's `selected` variant
// draws it, for a moment, then back to "Copy".
import { onBeforeUnmount, ref } from "vue";
import { Check, Copy, X } from "lucide-vue-next";
import { cn } from "@/lib/utils";

const props = defineProps({
  // What is shown and copied.
  value: { type: String, required: true },
  // Makes the value a link, such as the CSV the URL names.
  href: { type: String, default: undefined },
  // What the value is, for the button's accessible name: "Copy URL".
  label: { type: String, default: "URL" },
  // How long the confirmation shows, in milliseconds.
  confirmFor: { type: Number, default: 1500 },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
});

const state = ref("idle"); // idle | copied | failed
let timer;

async function copy() {
  clearTimeout(timer);
  try {
    await navigator.clipboard.writeText(props.value);
    state.value = "copied";
  } catch {
    // A refused clipboard (no permission, an insecure page) says so rather
    // than pretending the value is on it.
    state.value = "failed";
  }
  timer = setTimeout(() => (state.value = "idle"), props.confirmFor);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div :class="cn('inline-flex h-9 max-w-full items-stretch rounded-md border border-input bg-background shadow-sm', props.class)">
    <component
      :is="href ? 'a' : 'span'"
      :href="href"
      class="flex min-w-0 items-center truncate px-3 font-mono text-xs text-muted-foreground transition-colors"
      :class="href && 'hover:text-foreground'"
    >
      {{ value }}
    </component>
    <button
      type="button"
      :aria-label="`Copy ${label}`"
      class="inline-flex w-[6.25rem] shrink-0 items-center justify-center gap-1.5 rounded-r-[calc(var(--radius)-3px)] border-l border-input text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&_svg]:size-3.5"
      :class="{
        'hover:bg-accent hover:text-accent-foreground': state === 'idle',
        'bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))]': state === 'copied',
        'text-status-critical-text': state === 'failed',
      }"
      @click="copy"
    >
      <template v-if="state === 'copied'"><Check />Copied</template>
      <template v-else-if="state === 'failed'"><X />Failed</template>
      <template v-else><Copy />Copy</template>
    </button>
    <span class="sr-only" aria-live="polite">{{ state === "copied" ? `${label} copied` : state === "failed" ? `Could not copy the ${label}` : "" }}</span>
  </div>
</template>
