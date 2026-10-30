"use client";

import React, { useMemo } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCpu,
  FiFileText,
  FiLayers,
  FiPieChart,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import { SEVERITY_COLORS, SEVERITY_ORDER } from "../severity";
import ApexChart from "./ApexChart";
import ChartCard from "./ChartCard";
import {
  ACCENT,
  Bucket,
  HistoryPoint,
  NEUTRAL_GREY,
  SEVERITY_GROUP_SIZE,
  WINDOW_DAYS,
  buildDaily,
  buildRiskTrend,
  buildSeverityTrend,
  buildWeekday,
  countAxis,
  riskColor,
  toBuckets,
  toCategoryBuckets,
  toContextBuckets,
  toMlAgreement,
  toSeverityCounts,
  toStatusSlices,
} from "./analyticsData";

/** Charts the page can show or hide (the choice is remembered per browser). */
export const CHART_LIST = [
  { id: "severity", label: "Severity" },
  { id: "risk-hist", label: "Risk distribution" },
  { id: "top-cats", label: "Top categories" },
  { id: "context", label: "Context types" },
  { id: "confidence", label: "Confidence" },
  { id: "status", label: "Analysis status" },
  { id: "ml-agreement", label: "ML agreement" },
  { id: "ml-calibration", label: "ML calibration" },
  { id: "trend", label: "Risk trend" },
  { id: "volume", label: "Volume" },
  { id: "avg-risk-day", label: "Average risk per day" },
  { id: "risk-weekday", label: "Risk by weekday" },
  { id: "severity-trend", label: "Severity trend" },
] as const;

export type ChartId = (typeof CHART_LIST)[number]["id"];

export type HistoryState = {
  points: HistoryPoint[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Reports the history is drawn from, and how many exist in total. */
  loaded: number;
  total: number;
};

type Props = {
  analytics: SafetyAnalyticsSummary;
  history: HistoryState;
  isVisible: (id: ChartId) => boolean;
};

const wholeNumber = (value: number | string) => String(Math.round(Number(value)));

const CONFIDENCE_COLORS = [NEUTRAL_GREY, SEVERITY_COLORS.Low.hex, SEVERITY_COLORS.Moderate.hex, SEVERITY_COLORS.High.hex];

const bucketTable = (columns: [string, string], buckets: Bucket[]) => ({
  columns,
  rows: buckets.map((b) => [b.label, b.count]),
});

type BarSpec = {
  name: string;
  labels: string[];
  values: number[];
  colors: string[];
  horizontal?: boolean;
};

const barChart = ({ name, labels, values, colors, horizontal }: BarSpec) => {
  const axis = countAxis(Math.max(0, ...values));
  const valueAxis = { ...axis, labels: { formatter: wholeNumber } };
  const options: ApexCharts.ApexOptions = {
    colors,
    plotOptions: {
      bar: { horizontal, distributed: true, borderRadius: 4, columnWidth: "55%", barHeight: "60%" },
    },
    legend: { show: false },
    xaxis: horizontal
      ? ({ categories: labels, ...valueAxis } as ApexXAxis)
      : { categories: labels, labels: { style: { fontSize: "11px" } } },
    yaxis: horizontal
      ? { labels: { maxWidth: 160, style: { fontSize: "11px" } } }
      : (valueAxis as ApexYAxis),
    tooltip: { y: { formatter: (value: number) => String(value) } },
  };
  return { series: [{ name, data: values }], options };
};

const donutChart = (labels: string[], values: number[], colors: string[], centerLabel: string) => {
  const options: ApexCharts.ApexOptions = {
    labels,
    colors,
    legend: {
      position: "bottom",
      fontSize: "12px",
      formatter: (label: string, opts: any) => `${label}: ${opts.w.globals.series[opts.seriesIndex]}`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: { show: true, total: { show: true, showAlways: true, label: centerLabel } },
        },
      },
    },
    stroke: { width: 1 },
  };
  return { series: values, options };
};

export default function AnalyticsCharts({ analytics, history, isVisible }: Props) {
  // ── Summary-derived (always available once the analytics call succeeded) ───
  const severity = useMemo(() => toSeverityCounts(analytics.severity_distribution), [analytics]);
  const riskHist = useMemo(() => toBuckets(analytics.risk_score_histogram), [analytics]);
  const confHist = useMemo(() => toBuckets(analytics.confidence_histogram), [analytics]);
  const allCategories = useMemo(() => toCategoryBuckets(analytics.top_categories), [analytics]);
  const topCategories = useMemo(() => allCategories.slice(0, 8), [allCategories]);
  const contexts = useMemo(() => toContextBuckets(analytics.context_type_totals), [analytics]);
  const statuses = useMemo(() => toStatusSlices(analytics.status_distribution), [analytics]);
  const ml = useMemo(() => toMlAgreement(analytics.ml_agreement_totals), [analytics]);

  // ── History-derived ────────────────────────────────────────────────────────
  const trend = useMemo(() => buildRiskTrend(history.points), [history.points]);
  const daily = useMemo(() => buildDaily(history.points), [history.points]);
  const weekday = useMemo(() => buildWeekday(history.points), [history.points]);
  const severityTrend = useMemo(() => buildSeverityTrend(history.points), [history.points]);

  const historyProps = {
    isLoading: history.isLoading,
    isError: history.isError,
    onRetry: history.onRetry,
    errorText: "Couldn't load the report history for this chart.",
  };
  const historyNote =
    history.total > history.loaded ? `Based on the ${history.loaded} most recent of ${history.total} reports` : undefined;

  const severityTotal = severity.reduce((sum, s) => sum + s.count, 0);
  const mlRate = ml?.rate != null ? `${(ml.rate * 100).toFixed(1)}%` : null;
  const mlFooter = mlRate ? (
    <p className="text-sm text-gray-medium text-center mt-2 mb-0">
      Agreement rate: <strong className="text-dark">{mlRate}</strong>
    </p>
  ) : null;

  const weekdayAnalyses = weekday.map((w) => w.analyses);
  const dailyHasData = daily.some((d) => d.count > 0);

  return (
    <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))]">
      {isVisible("severity") && (
        <ChartCard
          title="Severity distribution"
          icon={FiShield}
          iconColor={SEVERITY_COLORS.High.hex}
          isEmpty={severityTotal === 0}
          emptyText="No analyses have a severity yet."
          table={{
            columns: ["Severity", "Reports"],
            rows: severity.map((s) => [s.severity, s.count]),
          }}
        >
          {(() => {
            const { series, options } = barChart({
              name: "Reports",
              labels: severity.map((s) => s.severity),
              values: severity.map((s) => s.count),
              colors: severity.map((s) => SEVERITY_COLORS[s.severity].hex),
            });
            return <ApexChart type="bar" series={series} options={options} />;
          })()}
        </ChartCard>
      )}

      {isVisible("risk-hist") && (
        <ChartCard
          title="Risk score distribution"
          icon={FiBarChart2}
          iconColor={ACCENT}
          isEmpty={riskHist.every((b) => b.count === 0)}
          emptyText="No risk scores yet."
          table={bucketTable(["Risk score range", "Reports"], riskHist)}
        >
          {(() => {
            const { series, options } = barChart({
              name: "Reports",
              labels: riskHist.map((b) => b.label),
              values: riskHist.map((b) => b.count),
              colors: riskHist.map((b) => riskColor(parseInt(b.label, 10) || 0)),
            });
            return <ApexChart type="bar" series={series} options={options} />;
          })()}
        </ChartCard>
      )}

      {isVisible("top-cats") && (
        <ChartCard
          title="Top risk categories"
          icon={FiTrendingUp}
          iconColor={SEVERITY_COLORS.High.hex}
          note={allCategories.length > topCategories.length ? `Top ${topCategories.length} of ${allCategories.length}` : undefined}
          isEmpty={topCategories.length === 0}
          emptyText="No risk categories have been detected yet."
          table={bucketTable(["Category", "Occurrences"], allCategories)}
        >
          {(() => {
            const { series, options } = barChart({
              name: "Occurrences",
              labels: topCategories.map((b) => b.label),
              values: topCategories.map((b) => b.count),
              colors: topCategories.map((_, i) =>
                i < 2 ? SEVERITY_COLORS.Critical.hex : i < 4 ? SEVERITY_COLORS.High.hex : SEVERITY_COLORS.Moderate.hex
              ),
              horizontal: true,
            });
            return (
              <ApexChart type="bar" series={series} options={options} height={Math.max(260, topCategories.length * 38 + 50)} />
            );
          })()}
        </ChartCard>
      )}

      {isVisible("context") && (
        <ChartCard
          title="Context types"
          icon={FiLayers}
          iconColor={ACCENT}
          note="Findings by conversation context"
          isEmpty={contexts.length === 0}
          emptyText="No findings have a context type yet."
          table={bucketTable(["Context type", "Findings"], contexts)}
        >
          {(() => {
            const { series, options } = barChart({
              name: "Findings",
              labels: contexts.map((b) => b.label),
              values: contexts.map((b) => b.count),
              colors: contexts.map(() => ACCENT),
              horizontal: true,
            });
            return <ApexChart type="bar" series={series} options={options} height={Math.max(260, contexts.length * 38 + 50)} />;
          })()}
        </ChartCard>
      )}

      {isVisible("confidence") && (
        <ChartCard
          title="Detection confidence"
          icon={FiCpu}
          iconColor={ACCENT}
          note="Reports by confidence (%)"
          isEmpty={confHist.every((b) => b.count === 0)}
          emptyText="No detections yet."
          table={bucketTable(["Confidence range (%)", "Reports"], confHist)}
        >
          {(() => {
            const { series, options } = barChart({
              name: "Reports",
              labels: confHist.map((b) => `${b.label}%`),
              values: confHist.map((b) => b.count),
              colors: confHist.map((_, i) => CONFIDENCE_COLORS[Math.min(i, CONFIDENCE_COLORS.length - 1)]),
            });
            return <ApexChart type="bar" series={series} options={options} />;
          })()}
        </ChartCard>
      )}

      {isVisible("status") && (
        <ChartCard
          title="Analysis status"
          icon={FiPieChart}
          iconColor={SEVERITY_COLORS.Low.hex}
          isEmpty={statuses.length === 0}
          emptyText="No analyses have run yet."
          table={{ columns: ["Status", "Analyses"], rows: statuses.map((s) => [s.label, s.count]) }}
        >
          {(() => {
            const { series, options } = donutChart(
              statuses.map((s) => s.label),
              statuses.map((s) => s.count),
              statuses.map((s) => s.color),
              "Analyses"
            );
            return <ApexChart type="donut" series={series} options={options} />;
          })()}
        </ChartCard>
      )}

      {isVisible("ml-agreement") && (
        <ChartCard
          title="ML and rule agreement"
          icon={FiCpu}
          iconColor={ACCENT}
          isEmpty={!ml}
          emptyText="The ML classifier hasn't weighed in on any findings yet."
          table={
            ml
              ? {
                  columns: ["Outcome", "Findings"],
                  rows: [
                    ["Agreed", ml.agreed],
                    ["Disagreed", ml.disagreed],
                    ["No ML signal", ml.noSignal],
                  ],
                }
              : undefined
          }
          footer={mlFooter}
        >
          {ml &&
            (() => {
              const slices = [
                { label: "Agreed", value: ml.agreed, color: SEVERITY_COLORS.Safe.hex },
                { label: "Disagreed", value: ml.disagreed, color: SEVERITY_COLORS.High.hex },
                { label: "No ML signal", value: ml.noSignal, color: NEUTRAL_GREY },
              ].filter((s) => s.value > 0);
              const { series, options } = donutChart(
                slices.map((s) => s.label),
                slices.map((s) => s.value),
                slices.map((s) => s.color),
                "Findings"
              );
              return <ApexChart type="donut" series={series} options={options} />;
            })()}
        </ChartCard>
      )}

      {isVisible("ml-calibration") && (
        <ChartCard
          title="ML calibration"
          icon={FiCpu}
          iconColor={SEVERITY_COLORS.Moderate.hex}
          note="Findings by ML outcome"
          isEmpty={!ml}
          emptyText="The ML classifier hasn't weighed in on any findings yet."
          table={
            ml
              ? {
                  columns: ["Outcome", "Findings"],
                  rows: [
                    ["ML agrees with rules", ml.agreed],
                    ["ML disagrees", ml.disagreed],
                    ["No ML signal", ml.noSignal],
                  ],
                }
              : undefined
          }
          footer={mlFooter}
        >
          {ml &&
            (() => {
              const rows = [
                { label: "ML agrees with rules", value: ml.agreed, color: SEVERITY_COLORS.Safe.hex },
                { label: "ML disagrees", value: ml.disagreed, color: SEVERITY_COLORS.High.hex },
                { label: "No ML signal", value: ml.noSignal, color: NEUTRAL_GREY },
              ].filter((r) => r.value > 0);
              const { series, options } = barChart({
                name: "Findings",
                labels: rows.map((r) => r.label),
                values: rows.map((r) => r.value),
                colors: rows.map((r) => r.color),
                horizontal: true,
              });
              return <ApexChart type="bar" series={series} options={options} height={Math.max(180, rows.length * 60 + 50)} />;
            })()}
        </ChartCard>
      )}

      {isVisible("trend") && (
        <ChartCard
          title="Risk score trend"
          icon={FiTrendingUp}
          iconColor={ACCENT}
          note={historyNote ?? "Last 20 analyses"}
          {...historyProps}
          isEmpty={trend.length < 2}
          emptyText="Needs at least two scored analyses."
          table={{ columns: ["Report", "Risk score"], rows: trend.map((t) => [t.full, t.score]) }}
        >
          <ApexChart
            type="line"
            series={[{ name: "Risk score", data: trend.map((t) => t.score) }]}
            options={{
              colors: [ACCENT],
              stroke: { curve: "smooth", width: 2.5 },
              markers: {
                size: 5,
                strokeColors: "#fff",
                strokeWidth: 1.5,
                discrete: trend.map((t, i) => ({
                  seriesIndex: 0,
                  dataPointIndex: i,
                  fillColor: riskColor(t.score),
                  strokeColor: "#fff",
                  size: 5,
                })),
              },
              xaxis: {
                categories: trend.map((t) => t.label),
                labels: { rotate: -35, rotateAlways: true, trim: true, style: { fontSize: "10px" } },
              },
              yaxis: { min: 0, max: 100, tickAmount: 5, labels: { formatter: wholeNumber } },
              annotations: {
                yaxis: [
                  { y: 80, borderColor: SEVERITY_COLORS.Critical.hex, strokeDashArray: 4, opacity: 0.5 },
                  { y: 40, borderColor: SEVERITY_COLORS.Moderate.hex, strokeDashArray: 4, opacity: 0.5 },
                ],
              },
              tooltip: { x: { formatter: (_v: number, opts: any) => trend[opts?.dataPointIndex]?.full ?? "" } },
            }}
          />
        </ChartCard>
      )}

      {isVisible("volume") && (
        <ChartCard
          title="Analysis volume"
          icon={FiFileText}
          iconColor={ACCENT}
          note={`Last ${WINDOW_DAYS} days`}
          {...historyProps}
          isEmpty={!dailyHasData}
          emptyText={`No analyses in the last ${WINDOW_DAYS} days.`}
          table={{ columns: ["Day", "Analyses"], rows: daily.map((d) => [d.label, d.count]) }}
        >
          <ApexChart
            type="area"
            height={240}
            series={[{ name: "Analyses", data: daily.map((d) => d.count) }]}
            options={{
              colors: [ACCENT],
              stroke: { curve: "smooth", width: 2 },
              fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
              xaxis: { categories: daily.map((d) => d.label), labels: { rotate: -45, style: { fontSize: "10px" } } },
              yaxis: { ...countAxis(Math.max(0, ...daily.map((d) => d.count))), labels: { formatter: wholeNumber } } as ApexYAxis,
            }}
          />
        </ChartCard>
      )}

      {isVisible("avg-risk-day") && (
        <ChartCard
          title="Average risk per day"
          icon={FiActivity}
          iconColor={SEVERITY_COLORS.Moderate.hex}
          note={`Last ${WINDOW_DAYS} days`}
          {...historyProps}
          isEmpty={!dailyHasData}
          emptyText={`No scored analyses in the last ${WINDOW_DAYS} days.`}
          table={{
            columns: ["Day", "Average risk score"],
            rows: daily.map((d) => [d.label, d.avg === null ? "No analyses" : d.avg]),
          }}
        >
          <ApexChart
            type="line"
            height={240}
            series={[{ name: "Average risk", data: daily.map((d) => d.avg) as number[] }]}
            options={{
              colors: [SEVERITY_COLORS.Moderate.hex],
              stroke: { curve: "straight", width: 2.5 },
              markers: { size: 4, strokeColors: "#fff", strokeWidth: 1.5 },
              xaxis: { categories: daily.map((d) => d.label), labels: { rotate: -45, style: { fontSize: "10px" } } },
              yaxis: { min: 0, max: 100, tickAmount: 5, labels: { formatter: wholeNumber } },
              annotations: {
                yaxis: [
                  { y: 80, borderColor: SEVERITY_COLORS.Critical.hex, strokeDashArray: 4, opacity: 0.5 },
                  { y: 40, borderColor: SEVERITY_COLORS.Moderate.hex, strokeDashArray: 4, opacity: 0.5 },
                ],
              },
            }}
          />
        </ChartCard>
      )}

      {isVisible("risk-weekday") && (
        <ChartCard
          title="Risk by weekday"
          icon={FiCalendar}
          iconColor={ACCENT}
          note={historyNote ?? "Average risk per day of the week"}
          {...historyProps}
          isEmpty={weekday.length === 0}
          emptyText="No scored analyses yet."
          table={{
            columns: ["Weekday", "Average risk score", "Analyses"],
            rows: weekday.map((w) => [w.day, w.avgRisk, w.analyses]),
          }}
        >
          <ApexChart
            type="bar"
            height={240}
            series={[{ name: "Average risk", data: weekday.map((w) => w.avgRisk) }]}
            options={{
              colors: weekday.map((w) => riskColor(w.avgRisk)),
              plotOptions: { bar: { distributed: true, borderRadius: 4, columnWidth: "55%" } },
              legend: { show: false },
              xaxis: { categories: weekday.map((w) => w.day) },
              yaxis: { min: 0, max: 100, tickAmount: 5, labels: { formatter: wholeNumber } },
              tooltip: {
                y: {
                  formatter: (value: number, opts: any) =>
                    `${value} (${weekdayAnalyses[opts?.dataPointIndex] ?? 0} analyses)`,
                },
              },
            }}
          />
        </ChartCard>
      )}

      {isVisible("severity-trend") && (
        <ChartCard
          title="Severity trend"
          icon={FiShield}
          iconColor={SEVERITY_COLORS.Critical.hex}
          note={`Grouped by ${SEVERITY_GROUP_SIZE} analyses`}
          {...historyProps}
          isEmpty={severityTrend.length < 2}
          emptyText={`Needs at least ${SEVERITY_GROUP_SIZE + 1} analyses with a severity.`}
          table={{
            columns: ["Analyses", ...SEVERITY_ORDER],
            rows: severityTrend.map((g) => [g.label, ...SEVERITY_ORDER.map((s) => g.counts[s])]),
          }}
        >
          {(() => {
            const stack = [...SEVERITY_ORDER].reverse();
            return (
              <ApexChart
                type="area"
                series={stack.map((s) => ({ name: s, data: severityTrend.map((g) => g.counts[s]) }))}
                options={{
                  chart: { stacked: true },
                  colors: stack.map((s) => SEVERITY_COLORS[s].hex),
                  stroke: { curve: "smooth", width: 1.5 },
                  fill: { type: "solid", opacity: 0.55 },
                  legend: { position: "bottom", fontSize: "12px" },
                  xaxis: { categories: severityTrend.map((g) => g.label), title: { text: "Analyses (oldest first)" } },
                  yaxis: { ...countAxis(SEVERITY_GROUP_SIZE), labels: { formatter: wholeNumber } } as ApexYAxis,
                }}
              />
            );
          })()}
        </ChartCard>
      )}
    </div>
  );
}
