<script setup>
// The gallery: every component, as a site composes it. Pick a site to see its
// header; the theme toggle in the header switches the whole page.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { Check } from "lucide-vue-next";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
  Badge, Button, CopyField,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label, Segmented,
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tooltip, TooltipContent, TooltipTrigger,
  XfinaFamily, XfinaHeader, XfinaProvider, chart,
} from "@/index.js";

const site = ref("data");
const dataset = ref("bis-usd-inr");
const app = ref("portfolio");
const version = ref("0.8");
const period = ref("5Y");
const added = ref(true);

const plot = ref(null);
let instance;
function draw() {
  const t = chart.echarts();
  const years = Array.from({ length: 11 }, (_, i) => 2016 + i);
  instance.setOption(
    {
      animation: false,
      color: t.color,
      textStyle: t.textStyle,
      legend: { ...t.legend, top: 0, right: 0 },
      tooltip: { ...t.tooltip, trigger: "axis" },
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      xAxis: { ...t.axis, type: "category", data: years, splitLine: { show: false } },
      yAxis: { ...t.axis, type: "value" },
      series: ["Portfolio", "Nifty 50", "Nasdaq 100"].map((name, k) => ({
        name,
        type: "line",
        showSymbol: false,
        lineStyle: { width: 2 },
        data: years.map((_, i) => Math.round(100 * Math.pow(1.08 + k * 0.03, i))),
      })),
    },
    true,
  );
}
const resize = () => instance?.resize();
onMounted(() => {
  instance = echarts.init(plot.value);
  draw();
  window.addEventListener("themechange", draw);
  window.addEventListener("resize", resize);
});
onBeforeUnmount(() => {
  window.removeEventListener("themechange", draw);
  window.removeEventListener("resize", resize);
});
watch(site, () => setTimeout(resize));
</script>

<template>
  <XfinaProvider>
    <main class="xf-container space-y-12">
      <XfinaHeader :key="site" :site="site" home="./" heading>
        <template v-if="site === 'data'" #context>
          <Select v-model="dataset">
            <SelectTrigger class="h-9 w-auto min-w-[140px] gap-2 shadow-sm" aria-label="Dataset"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All datasets</SelectItem>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>USD/INR Rates</SelectLabel>
                <SelectItem value="sbi-forex-card-usd">SBI forex card</SelectItem>
                <SelectItem value="bis-usd-inr">BIS USD/INR</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Inflation</SelectLabel>
                <SelectItem value="in-cpi">MoSPI CPI</SelectItem>
                <SelectItem value="in-cpi-imf">IMF CPI</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </template>
        <template v-else-if="site === 'labs'" #context>
          <Select v-model="app">
            <SelectTrigger class="h-9 w-auto min-w-[140px] gap-2 shadow-sm" aria-label="App"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All apps</SelectItem>
              <SelectItem value="portfolio">Portfolio Engine</SelectItem>
            </SelectContent>
          </Select>
        </template>
        <template v-else #context>
          <Select v-model="version">
            <SelectTrigger class="h-9 w-[140px] shadow-sm" aria-label="Version"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0.8">0.8.x (Latest)</SelectItem>
              <SelectItem value="0.7">0.7.x</SelectItem>
            </SelectContent>
          </Select>
        </template>
      </XfinaHeader>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold tracking-tight">Header</h2>
        <p class="text-sm text-muted-foreground">One component with a different <code>site</code>; each site supplies its own picker.</p>
        <Segmented v-model="site" label="Site" :options="[{ value: 'xfina', label: 'Xfina' }, { value: 'data', label: 'Data' }, { value: 'labs', label: 'Labs' }]" />
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold tracking-tight">Buttons, segmented, badges</h2>
        <div class="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button size="sm">Preview</Button>
          <Button as="a" href="#" size="sm" variant="outline">Download CSV</Button>
          <Button size="lg">Large</Button>
          <Segmented v-model="period" label="Period" :options="['1Y', '5Y', '10Y', 'All']" />
          <Button size="sm" class="w-[5.5rem]" :variant="added ? 'selected' : 'outline'" @click="added = !added">
            <Check v-if="added" class="!size-3.5" />{{ added ? "Added" : "Add" }}
          </Button>
        </div>
        <CopyField value="https://data.xfina.dev/v1/inflation/in-cpi-imf.csv" href="#" />
        <div class="flex flex-wrap items-center gap-2">
          <Badge>Recommended</Badge>
          <Badge variant="good">Valid</Badge>
          <Badge variant="warning">Design mock</Badge>
          <Badge variant="critical">Invalid</Badge>
          <Badge variant="soon">Not published yet</Badge>
        </div>
      </section>

      <section class="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
            <CardDescription>Header, content and footer, as shadcn draws them.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 text-sm text-muted-foreground">
            <p>Running text in a card, with <a href="#" class="text-foreground underline underline-offset-4">a link</a>.</p>
            <pre class="overflow-x-auto rounded-md bg-muted px-3.5 py-3 font-mono text-[13px] text-foreground">curl --compressed -O https://data.xfina.dev/v1/fx/bis-usd-inr.csv</pre>
          </CardContent>
          <CardFooter class="gap-2">
            <Dialog>
              <DialogTrigger as-child><Button size="sm">Open dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog</DialogTitle>
                  <DialogDescription>shadcn's Dialog, from xfina-ui.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Tooltip>
              <TooltipTrigger as-child><Button size="sm" variant="outline">Hover me</Button></TooltipTrigger>
              <TooltipContent>shadcn's Tooltip</TooltipContent>
            </Tooltip>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader><CardTitle>Form</CardTitle></CardHeader>
          <CardContent class="grid gap-4">
            <div class="space-y-1.5"><Label for="amount">Amount</Label><Input id="amount" placeholder="10,000" class="h-9" /></div>
            <div class="space-y-1.5"><Label for="from" class="text-muted-foreground">From</Label><Input id="from" type="date" class="h-9" /></div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Asset</TableHead><TableHead>Series</TableHead><TableHead>Ccy</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>Nifty 50</TableCell><TableCell>Nifty 50 TRI</TableCell><TableCell>INR</TableCell><TableCell><Badge variant="good">Valid</Badge></TableCell></TableRow>
            <TableRow><TableCell>Nasdaq 100</TableCell><TableCell>Irish UCITS ETF</TableCell><TableCell>USD</TableCell><TableCell><Badge variant="warning">Needs FX</Badge></TableCell></TableRow>
          </TableBody>
        </Table>
      </Card>

      <Accordion type="single" collapsible class="w-full">
        <AccordionItem value="a">
          <AccordionTrigger>Accordion</AccordionTrigger>
          <AccordionContent>shadcn's Accordion, from xfina-ui.</AccordionContent>
        </AccordionItem>
      </Accordion>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold tracking-tight">Chart theme</h2>
        <p class="text-sm text-muted-foreground"><code>chart.echarts()</code>: the same text, axes, legend, tooltip and series colours on every chart. It redraws with the theme.</p>
        <Card><CardContent class="pt-6"><div ref="plot" class="h-72 w-full" /></CardContent></Card>
      </section>

      <XfinaFamily :site="site" />
    </main>
  </XfinaProvider>
</template>
