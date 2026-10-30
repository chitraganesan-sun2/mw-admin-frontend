"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "antd";
import type { ReactNode } from "react";

// ApexCharts touches `window`, so it can only load on the client.
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <Skeleton.Node active style={{ width: "100%", height: 260 }}>{null}</Skeleton.Node>,
});

type ChartType = "bar" | "donut" | "radar" | "scatter";

interface ChartProps {
  type: ChartType;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  options: ApexCharts.ApexOptions;
  height?: number;
  /** Plain-language description of the data, for screen readers (the canvas itself is not readable). */
  summary: string;
}

export function Chart({ type, series, options, height = 280, summary }: ChartProps) {
  return (
    <div role="img" aria-label={summary}>
      <ReactApexChart
        type={type}
        series={series}
        height={height}
        options={{
          ...options,
          chart: { ...options.chart, toolbar: { show: false }, fontFamily: "inherit", animations: { enabled: false } },
        }}
      />
    </div>
  );
}

interface ChartCardProps {
  title: string;
  icon?: ReactNode;
  note?: string;
  children: ReactNode;
}

export function ChartCard({ title, icon, note, children }: ChartCardProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 min-w-0">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
        {icon}
        {title}
      </h3>
      {children}
      {note && <p className="text-xs text-gray-500 text-center mt-2">{note}</p>}
    </section>
  );
}
