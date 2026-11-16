// Only the parts of ECharts SeriesExplorer draws with: lines and bars for the
// chart, heatmaps on a calendar or a grid for the calendar, and the period
// slider. The whole library is over a megabyte; this is a fraction of it.
//
// It is imported dynamically, so a page pays for ECharts only once an explorer
// mounts, and a static build never runs it.

import * as echarts from "echarts/core";
import { BarChart, HeatmapChart, LineChart } from "echarts/charts";
import {
  CalendarComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  HeatmapChart,
  LineChart,
  CalendarComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
  CanvasRenderer,
]);

export default echarts;
