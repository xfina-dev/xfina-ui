import { cva } from "class-variance-authority";

export { default as Badge } from "./Badge.vue";

// Labs' Tag, with status colours from the tokens. A status badge always says
// what it means in words; the colour only repeats it. Its text takes the
// status's -text step, which stays readable on the tint where the status
// colour itself would not (warning on white is 1.7:1).
export const badgeVariants = cva(
  "inline-block whitespace-nowrap rounded-md border px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary-text",
        good: "border-status-good/40 bg-status-good/[0.12] text-status-good-text",
        warning: "border-status-warning/40 bg-status-warning/[0.12] text-status-warning-text",
        critical: "border-status-critical/40 bg-status-critical/[0.12] text-status-critical-text",
        // Planned, not yet available.
        soon: "border-dashed text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
