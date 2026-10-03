<script setup>
// One choice of a few, all shown at once: Labs' segmented control. The chosen
// button carries aria-pressed, which is also what a screen reader announces.
// Buttons are 34px inside a 1px border, so the control is 36px overall and
// lines up with size="sm" buttons and inputs beside it. The chosen one is
// drawn as Button's `selected` variant is: a primary outline on a faint
// tint, never a filled primary, which in dark mode is a near-white block.
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps({
  // Strings, or { value, label } where the label differs from the value.
  options: { type: Array, required: true },
  modelValue: { type: [String, Number], required: true },
  disabled: { type: Array, default: () => [] },
  label: { type: String, default: undefined },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
});
defineEmits(["update:modelValue"]);

const items = computed(() =>
  props.options.map((o) => (typeof o === "object" ? o : { value: o, label: String(o) })),
);
</script>

<template>
  <div role="group" :aria-label="label" :class="cn('inline-flex overflow-hidden rounded-md border border-border', props.class)">
    <button
      v-for="o in items"
      :key="o.value"
      type="button"
      :aria-pressed="o.value === modelValue"
      :disabled="disabled.includes(o.value)"
      class="h-[34px] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      :class="o.value === modelValue ? 'bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))] hover:bg-primary/10' : 'bg-background hover:bg-accent hover:text-accent-foreground'"
      @click="$emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
