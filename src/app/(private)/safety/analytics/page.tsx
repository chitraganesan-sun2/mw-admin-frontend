"use client";

import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Empty, Popover, Segmented, Skeleton } from "antd";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSliders,
} from "react-icons/fi";
import { getSafetyAnalytics, listSafetyReports } from "@/api/safety";
import { showToast } from "@/components/common/Toast";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { LiveStatus, SafetyPage } from "@/components/safety/ui/SafetyPage";
import { StatCard } from "@/components/safety/ui/StatCard";
import { formatRisk } from "@/components/safety/severity";
import AnalyticsCharts, { CHART_GROUPS, CHART_LIST, ChartGroupId, ChartId } from "@/components/safety/analytics/AnalyticsCharts";
import Highlights from "@/components/safety/analytics/Highlights";
import InsightsPanel from "@/components/safety/analytics/InsightsPanel";
import {
  buildHighlights,
  toCategoryBuckets,
  toHistoryPoints,
  toSeverityCounts,
} from "@/components/safety/analytics/analyticsData";

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

type Kpi = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: "neutral" | "info" | "good" | "warn" | "danger";
  emphasis?: boolean;
};

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
      showToast({ type: "error", message: getApiErrorMessage(analyticsQuery.error, "Couldn't load the analytics. Please try again.") });
    }
  }, [analyticsQuery.error]);

  // Which charts are hidden is a per-browser preference. Read after mount so server and client
  // render the same markup first.
  const [hidden, setHidden] = useState<ChartId[]>([]);
  useEffect(() => {
    setHidden(readHiddenCharts());
  }, []);

  const isVisible = useCallback((id: ChartId) => !hidden.includes(id), [hidden]);
  const [section, setSection] = useState<ChartGroupId>("overview");

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
      showToast({ type: "error", message: getApiErrorMessage(history.error, "Couldn't refresh the report history. Please try again.") });
    }
  };

  const analytics = analyticsQuery.data;
  const historyPoints = useMemo(() => toHistoryPoints(historyQuery.data?.reports), [historyQuery.data]);
  const isRefreshing = analyticsQuery.isFetching || historyQuery.isFetching;

  const highlights = useMemo(
    () => (analytics ? buildHighlights(toCategoryBuckets(analytics.top_categories), historyPoints) : []),
    [analytics, historyPoints]
  );
  const shownIn = (group: ChartGroupId) => CHART_LIST.filter((c) => c.group === group && !hidden.includes(c.id)).length;

  const kpis = useMemo<Kpi[]>(() => {
    if (!analytics) return [];
    const severity = Object.fromEntries(toSeverityCounts(analytics.severity_distribution).map((s) => [s.severity, s.count]));
    const avg = typeof analytics.avg_risk_score === "number" ? analytics.avg_risk_score : null;
    const attention = (severity.High ?? 0) + (severity.Critical ?? 0);
    return [
      { label: "Total analyzed", value: formatNumber(analytics.total_reports), icon: <FiFileText size={16} />, tone: "info" },
      {
        label: "High and critical",
        value: formatNumber(attention),
        hint: "Reports rated High or Critical",
        icon: <FiAlertTriangle size={16} />,
        tone: attention > 0 ? "warn" : "neutral",
        emphasis: attention > 0,
      },
      {
        label: "Average risk score",
        value: formatRisk(avg),
        hint: "Out of 100",
        icon: <FiActivity size={16} />,
        tone: avg !== null && avg > 60 ? "warn" : "neutral",
      },
      {
        label: "Safe and low",
        value: formatNumber((severity.Safe ?? 0) + (severity.Low ?? 0)),
        hint: "Reports rated Safe or Low",
        icon: <FiCheckCircle size={16} />,
        tone: "good",
      },
      {
        label: "Total findings",
        value: formatNumber(analytics.total_findings),
        hint: "Flagged passages across all reports",
        icon: <FiSearch size={16} />,
      },
      {
        label: "High confidence",
        value: formatNumber(analytics.high_confidence_count),
        hint: "Reports with detections at 75% confidence or higher",
        icon: <FiShield size={16} />,
      },
    ];
  }, [analytics]);

  return (
    <SafetyPage
      title="Analytics"
      description={`Charts and insights across all analyses${
        analyticsQuery.dataUpdatedAt ? ` · updated ${formatDisplayDateTime(analyticsQuery.dataUpdatedAt)}` : ""
      }`}
      status={<LiveStatus analysing={0} />}
      actions={
        <Button icon={<FiRefreshCw aria-hidden="true" />} loading={isRefreshing} onClick={refreshAll}>
          Refresh
        </Button>
      }
    >
      {analyticsQuery.isLoading ? (
        <div aria-busy="true" aria-label="Loading analytics" className="flex flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-stroke bg-white p-4">
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-stroke bg-white p-5">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        </div>
      ) : !analytics ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-stroke bg-white p-10 text-center">
          <p className="m-0 text-base font-medium text-dark">Couldn&apos;t load the analytics.</p>
          <p className="m-0 text-sm text-[#4F4F4F]">
            {getApiErrorMessage(analyticsQuery.error, "The safety service didn't respond. Please try again.")}
          </p>
          <Button type="primary" loading={analyticsQuery.isFetching} onClick={() => analyticsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {kpis.map((kpi) => (
              <StatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
                icon={kpi.icon}
                tone={kpi.tone}
                emphasis={kpi.emphasis}
              />
            ))}
          </section>

          {Number(analytics.total_reports) === 0 ? (
            <div className="rounded-2xl border border-stroke bg-white p-10">
              <Empty description="No analyses yet. Charts and insights appear once a report has been analyzed.">
                <Link href="/safety/upload">
                  <Button type="primary">Start a new analysis</Button>
                </Link>
              </Empty>
            </div>
          ) : (
            <>
              {historyQuery.isLoading ? (
                <div className="rounded-2xl border border-stroke bg-white p-5" aria-busy="true" aria-label="Loading highlights">
                  <Skeleton active title={false} paragraph={{ rows: 2 }} />
                </div>
              ) : (
                <Highlights items={highlights} />
              )}

              <InsightsPanel />

              <section aria-labelledby="safety-charts-heading" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id="safety-charts-heading" className="m-0 text-base font-semibold text-dark">
                    Charts
                  </h3>
                  <Popover
                    trigger="click"
                    placement="bottomRight"
                    title="Choose which charts to show"
                    content={
                      <div className="flex max-h-[38vh] w-[min(88vw,320px)] flex-col gap-3 overflow-y-auto">
                        {CHART_GROUPS.map((group) => (
                          <fieldset key={group.id} className="m-0 min-w-0 border-0 p-0">
                            <legend className="mb-1 p-0 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                              {group.label}
                            </legend>
                            <div className="flex flex-col gap-1">
                              {CHART_LIST.filter((c) => c.group === group.id).map(({ id, label }) => (
                                <Checkbox key={id} checked={isVisible(id)} onChange={() => toggleChart(id)}>
                                  {label}
                                </Checkbox>
                              ))}
                            </div>
                          </fieldset>
                        ))}
                        {hidden.length > 0 ? (
                          <Button size="small" onClick={showAllCharts}>
                            Show all charts
                          </Button>
                        ) : null}
                      </div>
                    }
                  >
                    <Button icon={<FiSliders aria-hidden="true" />}>
                      Customize{hidden.length > 0 ? ` (${hidden.length} hidden)` : ""}
                    </Button>
                  </Popover>
                </div>

                <div className="max-w-full overflow-x-auto">
                  <Segmented
                    aria-label="Chart section"
                    size="large"
                    value={section}
                    onChange={(value) => setSection(value as ChartGroupId)}
                    options={CHART_GROUPS.map((g) => ({ value: g.id, label: g.label }))}
                  />
                </div>

                {shownIn(section) === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-stroke bg-white p-10 text-center">
                    <p className="m-0 text-sm text-[#4F4F4F]">All the charts in this section are hidden.</p>
                    <Button onClick={showAllCharts}>Show all charts</Button>
                  </div>
                ) : (
                  <AnalyticsCharts
                    group={section}
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
              </section>
            </>
          )}
        </div>
      )}
    </SafetyPage>
  );
}
