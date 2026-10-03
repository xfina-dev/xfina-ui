<script setup>
// Wraps a site's whole app, once, at its root:
//
//   <XfinaProvider><App content /></XfinaProvider>
//
// While a Select, Dialog or other modal is open, reka-ui locks the page's
// scroll and, by default, pads <body> by the scrollbar's width so the page
// does not move when the scrollbar goes. style.css already reserves that
// space with scrollbar-gutter: stable, so the padding came on top of it and
// shifted the whole page left by the scrollbar's width on every open.
// scroll-body=false keeps the lock and drops the padding.
//
// It also provides the tooltip timing every Tooltip needs.
import { ConfigProvider } from "reka-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
</script>

<template>
  <ConfigProvider :scroll-body="false">
    <TooltipProvider>
      <slot />
    </TooltipProvider>
  </ConfigProvider>
</template>
