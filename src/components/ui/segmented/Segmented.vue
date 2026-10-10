<script setup>
// One choice of a few, all shown at once: Labs' segmented control. The chosen
// button carries aria-pressed, which is also what a screen reader announces.
//
// Each size is as tall overall as the Button it sits beside: sm 32px, default
// 36px (Button size="sm"), lg 44px (Button size="lg"), so a control and its
// buttons line up in one row.
//
// variant="default" draws the chosen option as Button's `selected` variant
// does: a primary outline on a faint tint, for a filter among other
// controls. The end buttons are rounded to the group's inside corner (its
// radius less its 1px border); square, an end button's outline was cut off
// by the group's rounded corner and did not close.
//
// variant="primary" fills the chosen option as a default Button, for a switch
// that changes everything below it (Labs' Nominal | Real) and must stand out
// as much as the page's main button. The options sit in a padded group, with
// corners concentric to it.
import { computed } from "vue";
import { cn } from "@/lib/utils";

const SIZES = {
  // The whole group, border included.
  group: { sm: "h-8", default: "h-9", lg: "h-11" },
  // Inside a 1px border.
  option: { sm: "h-[30px] px-2.5 text-xs", default: "h-[34px] px-3 text-sm", lg: "h-[42px] px-6 text-sm" },
  // Inside a 1px border and 3px of padding.
  primaryOption: { sm: "h-6 px-2.5 text-xs", default: "h-7 px-3 text-sm", lg: "h-9 px-6 text-sm" },
};
const VARIANTS = ["default", "primary"];

const props = defineProps({
  // Strings, or { value, label } where the label differs from the value.
  options: { type: Array, required: true },
  modelValue: { type: [String, Number], required: true },
  disabled: { type: Array, default: () => [] },
  label: { type: String, default: undefined },
  // sm, default or lg.
  size: { type: String, default: "default" },
  // default (an outline on the chosen option) or primary (a filled one).
  variant: { type: String, default: "default" },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
});
defineEmits(["update:modelValue"]);

// A misspelt size or variant would otherwise draw an unstyled group that
// looks like a styling bug rather than a typo.
const look = computed(() => {
  if (!(props.size in SIZES.group)) {
    throw new Error(`xfina-ui: Segmented size "${props.size}" is not one of ${Object.keys(SIZES.group).join(", ")}`);
  }
  if (!VARIANTS.includes(props.variant)) {
    throw new Error(`xfina-ui: Segmented variant "${props.variant}" is not one of ${VARIANTS.join(", ")}`);
  }
  return { size: props.size, primary: props.variant === "primary" };
});

const items = computed(() =>
  props.options.map((o) => (typeof o === "object" ? o : { value: o, label: String(o) })),
);

const group = computed(() =>
  look.value.primary
    ? cn("inline-flex items-center gap-1 rounded-lg border border-border bg-background p-[3px]", SIZES.group[look.value.size])
    : cn("inline-flex overflow-hidden rounded-md border border-border", SIZES.group[look.value.size]),
);

function option(chosen) {
  const base =
    "font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
  if (look.value.primary) {
    return cn(
      base,
      SIZES.primaryOption[look.value.size],
      "rounded-sm focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      chosen ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground",
    );
  }
  return cn(
    base,
    SIZES.option[look.value.size],
    "first:rounded-l-[calc(var(--radius)-3px)] last:rounded-r-[calc(var(--radius)-3px)] focus-visible:ring-inset",
    chosen
      ? "bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))] hover:bg-primary/10"
      : "bg-background hover:bg-accent hover:text-accent-foreground",
  );
}
</script>

<template>
  <div role="group" :aria-label="label" :class="cn(group, props.class)">
    <button
      v-for="o in items"
      :key="o.value"
      type="button"
      :aria-pressed="o.value === modelValue"
      :disabled="disabled.includes(o.value)"
      :class="option(o.value === modelValue)"
      @click="$emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
