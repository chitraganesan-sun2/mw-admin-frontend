"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Skeleton } from "antd";
import { FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";
import { getSafetyAnalytics, listSafetyReports } from "@/api/safety";
import { showToast } from "@/components/common/Toast";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import SafetyTabs from "@/components/safety/SafetyTabs";
import { SEVERITY_COLORS, formatRisk } from "@/components/safety/severity";
import AnalyticsCharts, { CHART_LIST, ChartId } from "@/components/safety/analytics/AnalyticsCharts";
import InsightsPanel from "@/components/safety/analytics/InsightsPanel";
import { riskColor, toHistoryPoints, toSeverityCounts } from "@/components/safety/analytics/analyticsData";

const HIDDEN_CHARTS_KEY = "safety_analytics_hidden_charts";
// The list endpoint's maximum page size; trend charts are drawn from the most recent reports.
const HISTORY_LIMIT = 500;

const readHiddenCharts = (): ChartId[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HIDDEN_CHARTS_KEY) || "[]");
    const known = new Set<string>(CHART_LIST.map((c) => c.id));
    return Array.isArray(parsed) ? parsed.filter((id): id is ChartId => typeof id === "string" && known.has(id)) : [];
  } catch {
    return [];
  }
};

const writeHiddenCharts = (ids: ChartId[]) => {
  try {
    localStorage.setItem(HIDDEN_CHARTS_KEY, JSON.stringify(ids));
  } catch {
    // Storage can be blocked (private window); the toggle still works for this visit.
  }
};

const formatNumber = (value: unknown): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "0";

type Kpi = { label: string; value: string; color?: string; hint?: string };

export default function SafetyAnalyticsPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  useEffect(() => {
    setHeaderOptions({ title: "Safety Monitoring", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const analyticsQuery = useQuery({ queryKey: ["safety-analytics"], queryFn: getSafetyAnalytics });
  const historyQuery = useQuery({
    queryKey: ["safety-analytics-history", HISTORY_LIMIT],
    queryFn: () => listSafetyReports({ limit: HISTORY_LIMIT }),
  });

  useEffect(() => {
    if (analyticsQuery.error) {
      showToast({ type: "error", message: getApiErrorMessage(analyticsQuery.error, "Couldn't load the analytics.") });
    }
  }, [analyticsQuery.error]);

  // Which charts are hidden is a per-browser preference. Read after mount so server and client
  // render the same markup first.
  const [hidden, setHidden] = useState<ChartId[]>([]);
  useEffect(() => {
    setHidden(readHiddenCharts());
  }, []);

  const isVisible = useCallback((id: ChartId) => !hidden.includes(id), [hidden]);

  const toggleChart = (id: ChartId) => {
    setHidden((current) => {
      const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
      writeHiddenCharts(next);
      return next;
    });
  };

  const showAllCharts = () => {
    setHidden([]);
    writeHiddenCharts([]);
  };

  const refreshAll = async () => {
    // A failed analytics refetch is toasted by the effect above; the history call is toasted here
    // when it fails while older data is still on screen (with no data its charts show the error).
    const [, history] = await Promise.all([analyticsQuery.refetch(), historyQuery.refetch()]);
    if (history.isError && history.data) {
      showToast({ type: "error", message: getApiErrorMessage(history.error, "Couldn't refresh the report history.") });
    }
  };

  const analytics = analyticsQuery.data;
  const historyPoints = useMemo(() => toHistoryPoints(historyQuery.data?.reports), [historyQuery.data]);
  const isRefreshing = analyticsQuery.isFetching || historyQuery.isFetching;

  const kpis = useMemo<Kpi[]>(() => {
    if (!analytics) return [];
    const severity = Object.fromEntries(toSeverityCounts(analytics.severity_distribution).map((s) => [s.severity, s.count]));
    const avg = typeof analytics.avg_risk_score === "number" ? analytics.avg_risk_score : null;
    return [
      { label: "Total analysed", value: formatNumber(analytics.total_reports) },
      {
        label: "High and critical",
        value: formatNumber((severity.High ?? 0) + (severity.Critical ?? 0)),
        color: SEVERITY_COLORS.High.hex,
        hint: "Reports rated High or Critical",
      },
      {
        label: "Average risk score",
        value: formatRisk(avg),
        color: avg === null ? undefined : riskColor(avg),
        hint: "Out of 100",
      },
      {
        label: "Safe and low",
        value: formatNumber((severity.Safe ?? 0) + (severity.Low ?? 0)),
        color: SEVERITY_COLORS.Safe.hex,
        hint: "Reports rated Safe or Low",
      },
      { label: "Total findings", value: formatNumber(analytics.total_findings), hint: "Flagged passages across all reports" },
      {
        label: "High confidence",
        value: formatNumber(analytics.high_confidence_count),
        hint: "Reports with detections at 75% confidence or higher",
      },
    ];
  }, [analytics]);

  return (
    <div className="p-6">
      <SafetyTabs />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold m-0">Analytics</h2>
          <p className="text-sm text-gray-medium m-0">
            Charts and insights across all analyses
            {analyticsQuery.dataUpdatedAt ? ` - updated ${formatDisplayDateTime(analyticsQuery.dataUpdatedAt)}` : ""}
          </p>
        </div>
        <Button icon={<FiRefreshCw aria-hidden="true" />} loading={isRefreshing} onClick={refreshAll}>
          Refresh
        </Button>
      </div>

      {analyticsQuery.isLoading ? (
        <div aria-busy="true" aria-label="Loading analytics" className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white rounded-xl p-4">
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-5">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        </div>
      ) : !analytics ? (
        <div role="alert" className="bg-white rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          <p className="text-base font-medium m-0">Couldn&apos;t load the analytics.</p>
          <p className="text-sm text-gray-medium m-0">
            {getApiErrorMessage(analyticsQuery.error, "The safety service didn't respond. Please try again.")}
          </p>
          <Button type="primary" loading={analyticsQuery.isFetching} onClick={() => analyticsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <section aria-label="Summary" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl p-4 min-w-0" title={kpi.hint}>
                <div className="text-xs font-medium text-gray-medium">{kpi.label}</div>
                <div className="text-2xl font-bold mt-1" style={kpi.color ? { color: kpi.color } : undefined}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </section>

          {Number(analytics.total_reports) === 0 ? (
            <div className="bg-white rounded-xl p-10">
              <Empty
                description="No analyses yet. Charts and insights appear once a report has been analysed."
              >
                <Link href="/safety/upload">
                  <Button type="primary">Start a new analysis</Button>
                </Link>
              </Empty>
            </div>
          ) : (
            <>
              <InsightsPanel />

              <section aria-labelledby="safety-chart-toggles" className="bg-white rounded-xl px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="safety-chart-toggles" className="text-sm font-semibold m-0 mr-1">
                    Show charts
                  </h3>
                  {CHART_LIST.map(({ id, label }) => {
                    const on = isVisible(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleChart(id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          on
                            ? "bg-[#1F2937] text-white border-[#1F2937]"
                            : "bg-white text-gray-medium border-stroke hover:bg-gray-50"
                        }`}
                      >
                        {on ? <FiEye aria-hidden="true" size={12} /> : <FiEyeOff aria-hidden="true" size={12} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {hidden.length === CHART_LIST.length ? (
                <div className="bg-white rounded-xl p-10 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-gray-medium m-0">All charts are hidden.</p>
                  <Button onClick={showAllCharts}>Show all charts</Button>
                </div>
              ) : (
                <AnalyticsCharts
                  analytics={analytics}
                  isVisible={isVisible}
                  history={{
                    points: historyPoints,
                    isLoading: historyQuery.isLoading,
                    isError: historyQuery.isError && !historyQuery.data,
                    onRetry: () => historyQuery.refetch(),
                    loaded: historyQuery.data?.reports.length ?? 0,
                    total: historyQuery.data?.total ?? 0,
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
