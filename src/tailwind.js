// The Tailwind preset every xfina.dev site uses:
//
//   // tailwind.config.js
//   import xfina from "xfina-ui/tailwind";
//   export default {
//     presets: [xfina],
//     content: ["./index.html", "./src/**/*.{vue,js}", "./node_modules/xfina-ui/dist/**/*.js"],
//   };
//
// The last content path is required. Tailwind lets a site's `content` replace
// a preset's rather than merge with it, so the preset cannot add it. Without
// it, the classes inside xfina-ui's components are never generated and they
// render unstyled.
//
// Every colour maps to a token from xfina-ui/style.css, written with
// <alpha-value> so opacity modifiers such as bg-primary/10 work. A site adds
// no colours of its own.

import plugin from "tailwindcss/plugin";
import { colours } from "./tokens.js";

const colour = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: Object.fromEntries(Object.keys(colours.light).map((name) => [name, colour(name)])),
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--reka-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--reka-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    // What shadcn puts in each site's own stylesheet, here once. In Tailwind's
    // base layer, after preflight, which would otherwise draw every border in
    // its own light grey (#e5e7eb) whatever the theme.
    plugin(({ addBase }) =>
      addBase({
        "*, ::before, ::after": { borderColor: "hsl(var(--border))" },
        body: { backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" },
        "input::placeholder, textarea::placeholder": { color: "hsl(var(--muted-foreground))" },
      }),
    ),
  ],
};
