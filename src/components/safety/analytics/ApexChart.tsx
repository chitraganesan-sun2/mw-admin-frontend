"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "antd";

// apexcharts touches `window` on import, so it is client-only.
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <Skeleton active title={false} paragraph={{ rows: 6 }} />,
});

type Series = ApexAxisChartSeries | ApexNonAxisChartSeries;

type ApexChartProps = {
  type: "bar" | "line" | "area" | "donut";
  series: Series;
  options: ApexCharts.ApexOptions;
  height?: number;
};

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
};

/** react-apexcharts with the look every Safety Monitoring chart shares. */
export default function ApexChart({ type, series, options, height = 260 }: ApexChartProps) {
  const reducedMotion = usePrefersReducedMotion();

  const merged = useMemo<ApexCharts.ApexOptions>(
    () => ({
      ...options,
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        animations: { enabled: !reducedMotion },
        ...options.chart,
        type,
      },
      grid: { borderColor: "#E5E7EB", strokeDashArray: 3, ...options.grid },
      dataLabels: { enabled: false, ...options.dataLabels },
    }),
    [options, type, reducedMotion]
  );

  return <Chart type={type} series={series as any} options={merged} height={height} width="100%" />;
}
