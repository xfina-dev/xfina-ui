<script setup>
// A colour from the theme, picked from a swatch: each asset's colour in Labs'
// Allocation table. The value is a token name ("chart-3"), never a hex, so
// the colour follows the theme: each swatch is the light or the dark value of
// its token, both validated against their own surface (src/tokens.js).
//
// The default set is every chart slot, shown around the colour wheel so a
// reader finds the hue they want. That is not the order a chart assigns
// them in: a site still gives its items their defaults in slot order, the
// order the palette was validated in, and the picker is for a reader
// overriding one.
//
// The grid is a radiogroup with one tab stop. Arrow keys only move focus and
// Enter or Space picks, unlike ARIA's radio pattern, where focus is the
// choice: there, arrowing across the grid would recolour the chart behind
// the popover at every step.
//
// The marks are drawn in the popover's own colours, never a fixed white or
// black: a white check is lost on the amber and green slots in light mode,
// a black one on the dark-mode purple.
import { computed, onMounted, ref } from "vue";
import { Check } from "lucide-vue-next";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { cn } from "@/lib/utils";
import { chartByHue } from "@/tokens.js";


const props = defineProps({
  // A token name from `colors`, or nothing yet.
  modelValue: { type: String, default: undefined },
  // Token names, in the order they are shown. Every chart slot by default,
  // grouped by hue.
  colors: { type: Array, default: () => chartByHue.map((n) => `chart-${n}`) },
  // Colours other items already use: token -> who uses them ("Gold"). The
  // caller leaves out the item's own colour.
  used: { type: Object, default: () => ({}) },
  // What is being coloured, for the trigger and the group: "Colour for Gold".
  label: { type: String, default: "Colour" },
  // How many swatches to a row. As near a square as the set allows by default.
  columns: { type: Number, default: undefined },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
});
const emit = defineEmits(["update:modelValue"]);

// A value outside the set would draw a swatch the picker cannot show as
// chosen, and the reader could never pick it back.
const selected = computed(() => {
  if (props.modelValue == null) return -1;
  const i = props.colors.indexOf(props.modelValue);
  if (i < 0) throw new Error(`xfina-ui: ColorPicker value "${props.modelValue}" is not one of ${props.colors.join(", ")}`);
  return i;
});

// Checked on mount, not when the popover first opens, so a mistake fails
// where the author sees it. A misspelt token draws a transparent swatch that
// looks like a gap in a palette rather than a mistake.
onMounted(() => {
  checkColumns(props.columns);
  const style = getComputedStyle(document.documentElement);
  for (const c of props.colors) {
    if (!style.getPropertyValue(`--${c}`).trim()) {
      throw new Error(`xfina-ui: --${c} is not defined; is xfina-ui/style.css imported?`);
    }
  }
});

const swatch = (c) => ({ background: `hsl(var(--${c}))` });
const name = (i) => `Colour ${i + 1}`;
const spoken = (c, i) => (props.used[c] ? `${name(i)}, used by ${props.used[c]}` : name(i));
const current = computed(() => (selected.value < 0 ? "none" : name(selected.value)));

// Zero or a fraction makes no grid at all, and the arrows would go nowhere.
function checkColumns(n) {
  if (n !== undefined && (!Number.isInteger(n) || n < 1)) {
    throw new Error(`xfina-ui: ColorPicker columns must be a whole number from 1, not ${n}`);
  }
}

// As near a square as the set allows, unless the site sets `columns`: the
// 16 chart slots are 4×4, 8 colours 3×3 with one gap, 17 to 25 are 5 wide. A
// single row of many would run off a phone, and a column of many off the
// bottom. Up and Down move by a row.
const width = computed(() => {
  checkColumns(props.columns);
  return props.columns ?? Math.ceil(Math.sqrt(props.colors.length));
});

const open = ref(false);
const focused = ref(0);
const swatches = ref([]);

function focus(i) {
  focused.value = i;
  swatches.value[i]?.focus();
}

// Opening lands on the chosen colour, so Enter straight away keeps it.
function onOpen(event) {
  event.preventDefault();
  focus(Math.max(selected.value, 0));
}

function onKey(event) {
  const n = props.colors.length;
  const i = focused.value;
  const to = {
    ArrowRight: (i + 1) % n,
    ArrowLeft: (i - 1 + n) % n,
    ArrowDown: i + width.value < n ? i + width.value : i,
    ArrowUp: i - width.value >= 0 ? i - width.value : i,
    Home: 0,
    End: n - 1,
  }[event.key];
  if (to === undefined) return;
  event.preventDefault();
  focus(to);
}

function pick(c) {
  emit("update:modelValue", c);
  open.value = false;
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :aria-label="`${label}: ${current}`"
        :class="cn('inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', props.class)"
      >
        <span
          class="size-3.5 rounded-sm"
          :class="selected < 0 && 'border border-dashed border-muted-foreground'"
          :style="selected < 0 ? undefined : swatch(modelValue)"
        />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-auto p-3" @open-auto-focus="onOpen">
      <div
        role="radiogroup"
        :aria-label="label"
        class="grid gap-2"
        :style="{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }"
        @keydown="onKey"
      >
        <Tooltip v-for="(c, i) in colors" :key="c" :disabled="!used[c]">
          <TooltipTrigger as-child>
            <button
              :ref="(el) => (swatches[i] = el)"
              type="button"
              role="radio"
              :aria-checked="i === selected"
              :aria-label="spoken(c, i)"
              :tabindex="i === focused ? 0 : -1"
              :data-color="c"
              class="relative grid size-7 place-items-center rounded-md ring-offset-popover transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              :style="swatch(c)"
              @click="pick(c)"
              @focus="focused = i"
            >
              <span v-if="i === selected" class="grid size-4 place-items-center rounded-full bg-popover text-popover-foreground">
                <Check class="size-3" :stroke-width="3" />
              </span>
              <span v-if="used[c]" data-used class="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-popover bg-popover-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Used by {{ used[c] }}</TooltipContent>
        </Tooltip>
      </div>
    </PopoverContent>
  </Popover>
</template>
