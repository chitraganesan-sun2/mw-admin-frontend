"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Input, Modal, Select, Skeleton, Table, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiCpu,
  FiDownload,
  FiFileText,
  FiGitMerge,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useComponentStore } from "@/store/useComponenetStore";
import { getHeaderIcon } from "@/layouts/helper";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import {
  bulkDeleteSafetyReports,
  deleteSafetyReport,
  downloadSafetyReportPdf,
  getSafetyAnalytics,
  listSafetyReports,
} from "@/api/safety";
import SafetyTabs from "@/components/safety/SafetyTabs";
import { SeverityTag, StatusTag } from "@/components/safety/SeverityTag";
import {
  SEVERITY_COLORS,
  SEVERITY_ORDER,
  STATUS_LABELS,
  formatRisk,
  isInFlight,
  severityRank,
} from "@/components/safety/severity";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <Skeleton.Node active style={{ width: "100%", height: 220 }}>{" "}</Skeleton.Node>,
});

/*
 * Server vs client side
 * ---------------------
 * SERVER: paging (`skip` / `limit`, page sizes up to 200 of the API's 500 cap), the "Session" filter
 *   (`session_id`, exact match) and the KPI cards + severity chart (`/analytics`, which covers every
 *   report, not just the loaded page).
 * CLIENT, over the reports loaded on the current page only: file-name search, severity, status, date
 *   range and column sorting. Severity is deliberately NOT sent as the API's `severity` param: that
 *   (like `session_id`) switches the backend to the MelodyWings link records, which leave out reports
 *   that arrived by Google Drive import, so it would hide rows the unfiltered list shows.
 */

const POLL_MS = 5000;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];
const BULK_DELETE_CHUNK = 100; // the API accepts at most 100 ids per request
const ROW_INTERACTIVE = "a, button, input, label, .ant-checkbox-wrapper, .ant-table-selection-column";

type DatePreset = "all" | "today" | "yesterday" | "custom";

// Risk-score band -> severity colour, mirroring the pipeline's own score bands.
const riskColor = (score?: number | null): string => {
  if (typeof score !== "number") return "#9CA3AF";
  if (score >= 80) return SEVERITY_COLORS.Critical.hex;
  if (score >= 61) return SEVERITY_COLORS.High.hex;
  if (score >= 41) return SEVERITY_COLORS.Moderate.hex;
  if (score >= 21) return SEVERITY_COLORS.Low.hex;
  return SEVERITY_COLORS.Safe.hex;
};

const RiskBar = ({ score }: { score?: number | null }) => (
  <div className="flex items-center gap-2 min-w-[110px]">
    <div className="h-1.5 w-16 rounded-full bg-gray-100 shrink-0" aria-hidden>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, score ?? 0))}%`, background: riskColor(score) }}
      />
    </div>
    <span className="text-xs font-semibold tabular-nums" style={{ color: riskColor(score) }}>
      {typeof score === "number" ? score.toFixed(0) : "-"}
    </span>
  </div>
);

// Severity counts keyed by our canonical names (the pipeline's casing is not relied on).
const severityCounts = (distribution?: Record<string, number> | null): Record<SafetySeverity, number> => {
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0])) as Record<SafetySeverity, number>;
  Object.entries(distribution ?? {}).forEach(([key, value]) => {
    const match = SEVERITY_ORDER.find((s) => s.toLowerCase() === key.toLowerCase());
    if (match && typeof value === "number") counts[match] += value;
  });
  return counts;
};

const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "-");

const KpiCard = ({
  title,
  value,
  hint,
  icon,
  color,
}: {
  title: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-gray-500">{title}</span>
      <span style={{ color }} aria-hidden>
        {icon}
      </span>
    </div>
    <span className="text-2xl font-semibold tabular-nums" style={{ color }}>
      {value}
    </span>
    <span className="text-xs text-gray-400">{hint}</span>
  </div>
);

// CSV cells beginning with = + - @ would be run as formulas by spreadsheets; a leading quote defuses them.
const csvCell = (value: unknown): string => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const buildCsv = (rows: SafetyReportRow[]): string => {
  const header = ["ID", "File name", "Risk score", "Severity", "Status", "Session ID", "Volunteer ID", "Learner ID", "Created at"];
  const lines = rows.map((r) =>
    [
      r.id,
      r.filename,
      typeof r.risk_score === "number" ? r.risk_score.toFixed(1) : "",
      r.severity ?? "",
      r.status ?? "",
      r.session_id ?? "",
      r.volunteer_id ?? "",
      r.learner_id ?? "",
      r.created_at ?? "",
    ]
      .map(csvCell)
      .join(",")
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
};

const saveCsv = (rows: SafetyReportRow[]) => {
  // BOM so Excel reads the file as UTF-8.
  const blob = new Blob(["﻿" + buildCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `safety-reports-${dayjs().format("YYYY-MM-DD")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function SafetyReportsPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Server-side state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sessionInput, setSessionInput] = useState("");
  const [debouncedSession, setDebouncedSession] = useState("");

  // Client-side filters (applied to the loaded page)
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | SafetySeverity>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selection / dialogs
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SafetyReportRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  // Every row seen so far, so a selection that spans pages can still be exported.
  const rowCache = useRef(new Map<number, SafetyReportRow>());

  useEffect(() => {
    setHeaderOptions({ title: "Safety Monitoring", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSession(sessionInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [sessionInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSession]);

  // ── Data ───────────────────────────────────────────────────────────────────

  const reportsQuery = useQuery({
    queryKey: ["safety-reports", page, pageSize, debouncedSession],
    queryFn: () =>
      listSafetyReports({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        session_id: debouncedSession || undefined,
      }),
    placeholderData: keepPreviousData,
    // The live WebSocket progress is gone; poll while anything on screen is still being analysed.
    refetchInterval: (query) =>
      query.state.data?.reports?.some((r) => isInFlight(r.status)) ? POLL_MS : false,
    retry: 1,
  });

  const rows = useMemo(() => reportsQuery.data?.reports ?? [], [reportsQuery.data]);
  const total = reportsQuery.data?.total ?? 0;
  const hasProcessing = rows.some((r) => isInFlight(r.status));

  useEffect(() => {
    rows.forEach((r) => rowCache.current.set(r.id, r));
  }, [rows]);

  // Landed past the end (e.g. after deleting the last row of the final page): step back.
  useEffect(() => {
    if (reportsQuery.isFetching || !reportsQuery.data) return;
    if (rows.length === 0 && total > 0 && page > 1) setPage(Math.max(1, Math.ceil(total / pageSize)));
  }, [reportsQuery.isFetching, reportsQuery.data, rows.length, total, page, pageSize]);

  // KPI cards + chart come from the analytics summary, which covers all reports (not just this page).
  const analyticsQuery = useQuery({
    queryKey: ["safety-analytics"],
    queryFn: getSafetyAnalytics,
    staleTime: 30_000,
    refetchInterval: hasProcessing ? POLL_MS * 2 : false,
    retry: 1,
  });
  const analytics = analyticsQuery.data;

  const refreshAll = () => {
    reportsQuery.refetch();
    analyticsQuery.refetch();
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["safety-reports"] });
    queryClient.invalidateQueries({ queryKey: ["safety-analytics"] });
  };

  // ── Client-side filtering ──────────────────────────────────────────────────

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let from: number | null = null;
    let to: number | null = null;
    if (datePreset === "today") from = dayjs().startOf("day").valueOf();
    if (datePreset === "yesterday") {
      from = dayjs().subtract(1, "day").startOf("day").valueOf();
      to = dayjs().startOf("day").valueOf() - 1;
    }
    if (datePreset === "custom") {
      from = startDate ? dayjs(startDate).startOf("day").valueOf() : null;
      to = endDate ? dayjs(endDate).endOf("day").valueOf() : null;
    }
    return rows.filter((r) => {
      if (q && !(r.filename || "").toLowerCase().includes(q)) return false;
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      if (statusFilter !== "all" && String(r.status ?? "").toUpperCase() !== statusFilter) return false;
      if (from !== null || to !== null) {
        if (!r.created_at) return false;
        const t = dayjs(r.created_at).valueOf();
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
      }
      return true;
    });
  }, [rows, search, severityFilter, statusFilter, datePreset, startDate, endDate]);

  const clientFilterActive =
    search.trim() !== "" || severityFilter !== "all" || statusFilter !== "all" || datePreset !== "all";
  const anyFilterActive = clientFilterActive || debouncedSession !== "";

  const clearFilters = () => {
    setSearch("");
    setSeverityFilter("all");
    setStatusFilter("all");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setSessionInput("");
    setDebouncedSession("");
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSafetyReport(id),
    onSuccess: (_data, id) => {
      rowCache.current.delete(id);
      setSelectedKeys((keys) => keys.filter((k) => k !== id));
      showToast({ type: "success", message: `Report #${id} deleted.` });
      invalidateAll();
    },
    onError: (err) => {
      showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't delete the report. Please try again.") });
    },
    onSettled: () => setDeleteTarget(null),
  });

  const bulkDeleteMutation = useMutation({
    // The API takes at most 100 ids per call, so a bigger selection is sent in chunks. A chunk that
    // errors is counted as failed and the remaining chunks still run.
    mutationFn: async (ids: number[]) => {
      const deleted: number[] = [];
      const notFound: number[] = [];
      const failed: number[] = [];
      for (let i = 0; i < ids.length; i += BULK_DELETE_CHUNK) {
        const chunk = ids.slice(i, i + BULK_DELETE_CHUNK);
        try {
          const result = await bulkDeleteSafetyReports(chunk);
          deleted.push(...(result.deleted ?? []));
          notFound.push(...(result.not_found ?? []));
        } catch {
          failed.push(...chunk);
        }
      }
      return { deleted, notFound, failed };
    },
    onSuccess: ({ deleted, notFound, failed }) => {
      const gone = new Set([...deleted, ...notFound]);
      gone.forEach((id) => rowCache.current.delete(id));
      // Keep only what could not be deleted selected, so it can be retried.
      setSelectedKeys((keys) => keys.filter((k) => !gone.has(k)));
      const parts: string[] = [];
      if (deleted.length) parts.push(`Deleted ${deleted.length} ${deleted.length === 1 ? "report" : "reports"}.`);
      if (notFound.length) parts.push(`${notFound.length} could not be found (already deleted).`);
      if (failed.length) parts.push(`Couldn't delete ${failed.length}. Please try again.`);
      showToast({ type: failed.length ? "error" : "success", message: parts.join(" ") || "Nothing was deleted." });
      invalidateAll();
    },
    onSettled: () => setBulkDeleteOpen(false),
  });

  const handleDownloadPdf = useCallback(async (id: number) => {
    setDownloadingId(id);
    try {
      await downloadSafetyReportPdf(id); // shows its own error toast
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleExport = () => {
    const selectedRows = selectedKeys.map((id) => rowCache.current.get(id)).filter(Boolean) as SafetyReportRow[];
    const toExport = selectedRows.length ? selectedRows : filteredRows;
    if (!toExport.length) {
      showToast({ type: "info", message: "There are no reports to export." });
      return;
    }
    saveCsv(toExport);
    showToast({ type: "success", message: `Exported ${toExport.length} ${toExport.length === 1 ? "report" : "reports"}.` });
  };

  // ── KPIs ───────────────────────────────────────────────────────────────────

  const counts = severityCounts(analytics?.severity_distribution);
  const analysed = analytics?.total_reports ?? 0;
  const highRisk = counts.High + counts.Critical;
  const safeLow = counts.Safe + counts.Low;
  const chartSeverities = SEVERITY_ORDER.filter((s) => counts[s] > 0);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, animations: { enabled: false } },
    labels: chartSeverities,
    colors: chartSeverities.map((s) => SEVERITY_COLORS[s].hex),
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 1 },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: { show: true, total: { show: true, label: "Reports", formatter: () => String(analysed) } },
        },
      },
    },
    tooltip: { y: { formatter: (value: number) => `${value} ${value === 1 ? "report" : "reports"}` } },
  };

  // ── Table ──────────────────────────────────────────────────────────────────

  const columns: TableColumnsType<SafetyReportRow> = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 80,
        sorter: (a, b) => a.id - b.id,
        render: (id: number) => <span className="font-mono text-xs text-gray-500">#{id}</span>,
      },
      {
        title: "File name",
        dataIndex: "filename",
        key: "filename",
        sorter: (a, b) => (a.filename || "").localeCompare(b.filename || ""),
        render: (filename: string, record) => (
          <Link
            href={`/safety/report/${record.id}`}
            title={filename}
            className="block max-w-[260px] truncate font-medium text-gray-800 hover:underline"
          >
            {filename || "Untitled"}
          </Link>
        ),
      },
      {
        title: "Risk score",
        dataIndex: "risk_score",
        key: "risk_score",
        sorter: (a, b) => (a.risk_score ?? -1) - (b.risk_score ?? -1),
        render: (score: number | null) => <RiskBar score={score} />,
      },
      {
        title: "Severity",
        dataIndex: "severity",
        key: "severity",
        sorter: (a, b) => severityRank(a.severity) - severityRank(b.severity),
        render: (severity: string | null) => <SeverityTag severity={severity} />,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: string) => <StatusTag status={status} />,
      },
      {
        title: "Linked to",
        key: "links",
        responsive: ["lg"],
        render: (_: unknown, record) => {
          const links = [
            ["Session", record.session_id],
            ["Volunteer", record.volunteer_id],
            ["Learner", record.learner_id],
          ].filter(([, value]) => value) as [string, string][];
          if (!links.length) return <span className="text-gray-400">-</span>;
          return (
            <div className="flex flex-col gap-0.5 text-xs text-gray-600">
              {links.map(([label, value]) => (
                <Tooltip key={label} title={`${label} ID: ${value}`}>
                  <span className="block max-w-[180px] truncate">
                    <span className="text-gray-400">{label}:</span> {value}
                  </span>
                </Tooltip>
              ))}
            </div>
          );
        },
      },
      {
        title: "Date",
        dataIndex: "created_at",
        key: "created_at",
        sorter: (a, b) => dayjs(a.created_at ?? 0).valueOf() - dayjs(b.created_at ?? 0).valueOf(),
        render: (value: string | null) => (
          <span className="text-xs text-gray-600 whitespace-nowrap">{formatDisplayDateTime(value)}</span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 110,
        render: (_: unknown, record) => (
          <div className="flex gap-1">
            <Tooltip title={record.status === "COMPLETED" ? "Download PDF" : "The PDF is available once the analysis completes"}>
              <Button
                type="text"
                icon={<FiFileText />}
                aria-label={`Download PDF for report ${record.id}`}
                loading={downloadingId === record.id}
                disabled={record.status !== "COMPLETED"}
                onClick={() => handleDownloadPdf(record.id)}
              />
            </Tooltip>
            <Tooltip title="Delete report">
              <Button
                type="text"
                danger
                icon={<FiTrash2 />}
                aria-label={`Delete report ${record.id}`}
                onClick={() => setDeleteTarget(record)}
              />
            </Tooltip>
          </div>
        ),
      },
    ],
    [downloadingId, handleDownloadPdf]
  );

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <FiShield className="text-3xl text-gray-300" aria-hidden />
      {anyFilterActive ? (
        <>
          <p className="font-medium text-gray-700">
            {rows.length === 0 && debouncedSession ? "No reports found for this session" : "No reports match your filters"}
          </p>
          <p className="max-w-sm text-sm text-gray-500">
            {clientFilterActive && rows.length > 0
              ? "Search, severity, status and date only look at the reports loaded on this page. Try another page or a larger page size."
              : "Try a different session ID, or clear the filters."}
          </p>
          <Button onClick={clearFilters}>Clear filters</Button>
        </>
      ) : (
        <>
          <p className="font-medium text-gray-700">No reports yet</p>
          <p className="max-w-sm text-sm text-gray-500">
            Analyse a call recording, video or transcript to see its safety report here.
          </p>
          <Link href="/safety/upload">
            <Button type="primary" icon={<FiPlus />}>
              Start a new analysis
            </Button>
          </Link>
        </>
      )}
    </div>
  );

  const controlLabel = "block text-xs font-medium text-gray-600 mb-1";
  const selectedCount = selectedKeys.length;

  return (
    <div className="p-6">
      <SafetyTabs />

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-500">All analyses. Open any row for its full report.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasProcessing && (
            <span className="text-xs text-gray-500" role="status">
              Updating while analyses run
            </span>
          )}
          <Button icon={<FiRefreshCw className={reportsQuery.isFetching ? "animate-spin" : ""} />} onClick={refreshAll}>
            Refresh
          </Button>
          <Link href="/safety/upload">
            <Button type="primary" icon={<FiPlus />}>
              New analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI cards + severity chart */}
      {analyticsQuery.isError && !analytics ? (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message="Couldn't load the summary figures."
          action={
            <Button size="small" onClick={() => analyticsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:col-span-2 content-start">
            {analyticsQuery.isLoading || !analytics ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                  <Skeleton active paragraph={{ rows: 1 }} />
                </div>
              ))
            ) : (
              <>
                <KpiCard
                  title="Analysed reports"
                  value={analysed}
                  hint="completed analyses"
                  icon={<FiFileText size={20} />}
                  color="#3B82F6"
                />
                <KpiCard
                  title="High / critical risk"
                  value={highRisk}
                  hint={`${percent(highRisk, analysed)} of analysed`}
                  icon={<FiAlertTriangle size={20} />}
                  color={SEVERITY_COLORS.High.hex}
                />
                <KpiCard
                  title="Average risk score"
                  value={formatRisk(analytics.avg_risk_score)}
                  hint="out of 100"
                  icon={<FiBarChart2 size={20} />}
                  color={riskColor(analytics.avg_risk_score)}
                />
                <KpiCard
                  title="Safe / low risk"
                  value={safeLow}
                  hint={`${percent(safeLow, analysed)} of analysed`}
                  icon={<FiCheckCircle size={20} />}
                  color={SEVERITY_COLORS.Safe.hex}
                />
                <KpiCard
                  title="Total findings"
                  value={analytics.total_findings ?? 0}
                  hint="across all reports"
                  icon={<FiActivity size={20} />}
                  color="#6366F1"
                />
                <KpiCard
                  title="High-confidence detections"
                  value={analytics.high_confidence_count ?? 0}
                  hint={
                    analytics.total_findings
                      ? `${percent(analytics.high_confidence_count ?? 0, analytics.total_findings)} of all findings`
                      : "findings with 75% confidence or more"
                  }
                  icon={<FiCpu size={20} />}
                  color="#0EA5E9"
                />
              </>
            )}
          </div>

          <section className="rounded-xl border border-gray-100 bg-white p-4" aria-label="Severity distribution">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Severity distribution</h3>
            {analyticsQuery.isLoading || !analytics ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : chartSeverities.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">No analysed reports yet.</p>
            ) : (
              <>
                <Chart
                  options={chartOptions}
                  series={chartSeverities.map((s) => counts[s])}
                  type="donut"
                  height={200}
                />
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  {chartSeverities.map((s) => (
                    <li key={s} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: SEVERITY_COLORS[s].hex }}
                          aria-hidden
                        />
                        {s}
                      </span>
                      <span className="tabular-nums font-medium">{counts[s]}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}

      {/* History table */}
      <section className="rounded-xl border border-gray-100 bg-white p-4" aria-label="Analysis history">
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="safety-search" className={controlLabel}>
              Search by file name
            </label>
            <Input
              id="safety-search"
              allowClear
              prefix={<FiSearch className="text-gray-400" aria-hidden />}
              placeholder="Search files"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-w-[200px]">
            <label htmlFor="safety-session" className={controlLabel}>
              Session ID
            </label>
            <Input
              id="safety-session"
              allowClear
              placeholder="Filter by session"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
            />
          </div>
          <div className="w-[150px]">
            <label htmlFor="safety-severity" className={controlLabel}>
              Severity
            </label>
            <Select
              id="safety-severity"
              className="w-full"
              value={severityFilter}
              onChange={setSeverityFilter}
              options={[
                { value: "all", label: "All severities" },
                ...SEVERITY_ORDER.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
          <div className="w-[150px]">
            <label htmlFor="safety-status" className={controlLabel}>
              Status
            </label>
            <Select
              id="safety-status"
              className="w-full"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                ...Object.entries(STATUS_LABELS).map(([value, { label }]) => ({ value, label })),
              ]}
            />
          </div>
          <div className="w-[150px]">
            <label htmlFor="safety-date" className={controlLabel}>
              Date
            </label>
            <Select
              id="safety-date"
              className="w-full"
              value={datePreset}
              onChange={(v: DatePreset) => setDatePreset(v)}
              options={[
                { value: "all", label: "All time" },
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "custom", label: "Custom range" },
              ]}
            />
          </div>
          {datePreset === "custom" && (
            <>
              <div>
                <label htmlFor="safety-date-from" className={controlLabel}>
                  From
                </label>
                <Input id="safety-date-from" type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="safety-date-to" className={controlLabel}>
                  To
                </label>
                <Input id="safety-date-to" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}
          {anyFilterActive && (
            <Button type="link" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-h-[32px]">
          <p className="text-xs text-gray-500">
            {reportsQuery.data
              ? clientFilterActive
                ? `Showing ${filteredRows.length} of ${rows.length} reports on this page (${total} in total). Search, severity, status and date filter this page only.`
                : `${total} ${total === 1 ? "report" : "reports"}${debouncedSession ? " for this session" : ""}`
              : " "}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 && <span className="text-sm font-medium text-gray-700">{selectedCount} selected</span>}
            {selectedCount === 2 && (
              <Button
                icon={<FiGitMerge />}
                onClick={() => router.push(`/safety/compare?ids=${selectedKeys.join(",")}`)}
              >
                Compare
              </Button>
            )}
            <Button icon={<FiDownload />} onClick={handleExport} disabled={!filteredRows.length && !selectedCount}>
              {selectedCount > 0 ? "Export selected" : "Export CSV"}
            </Button>
            {selectedCount > 0 && (
              <>
                <Button danger icon={<FiTrash2 />} onClick={() => setBulkDeleteOpen(true)}>
                  Delete selected
                </Button>
                <Button type="text" icon={<FiX />} aria-label="Clear selection" onClick={() => setSelectedKeys([])} />
              </>
            )}
          </div>
        </div>

        {reportsQuery.isError && reportsQuery.data && (
          <Alert
            className="mb-3"
            type="warning"
            showIcon
            message="Couldn't refresh the reports. Showing the last loaded list."
            action={
              <Button size="small" onClick={() => reportsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        )}

        {reportsQuery.isError && !reportsQuery.data ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
            <FiAlertTriangle className="text-3xl text-red-400" aria-hidden />
            <p className="font-medium text-gray-700">Couldn&apos;t load the reports.</p>
            <p className="max-w-sm text-sm text-gray-500">
              {getApiErrorMessage(reportsQuery.error, "The safety service may be unavailable. Please try again.")}
            </p>
            <Button type="primary" icon={<FiRefreshCw />} onClick={() => reportsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <Table<SafetyReportRow>
            rowKey="id"
            columns={columns}
            dataSource={filteredRows}
            loading={reportsQuery.isLoading || (reportsQuery.isFetching && reportsQuery.isPlaceholderData)}
            scroll={{ x: 900 }}
            locale={{ emptyText: emptyState }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              preserveSelectedRowKeys: true,
              onChange: (keys) => setSelectedKeys(keys as number[]),
            }}
            onRow={(record) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                if ((event.target as HTMLElement).closest(ROW_INTERACTIVE)) return;
                router.push(`/safety/report/${record.id}`);
              },
            })}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
            }}
            onChange={(pagination) => {
              const nextSize = pagination.pageSize ?? pageSize;
              if (nextSize !== pageSize) {
                setPageSize(nextSize);
                setPage(1);
              } else {
                setPage(pagination.current ?? 1);
              }
            }}
          />
        )}
      </section>

      {/* Declarative modals: antd's static Modal.confirm throws on this app's React version. */}
      <Modal
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete report #${deleteTarget.id}?` : "Delete report?"}
        okText="Delete"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
        cancelButtonProps={{ disabled: deleteMutation.isPending }}
        onOk={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
        maskClosable={!deleteMutation.isPending}
      >
        <p>
          This permanently removes{" "}
          <strong className="break-all">{deleteTarget?.filename || "this report"}</strong> and its findings. This can&apos;t be undone.
        </p>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        title={`Delete ${selectedCount} ${selectedCount === 1 ? "report" : "reports"}?`}
        okText="Delete"
        okButtonProps={{ danger: true }}
        confirmLoading={bulkDeleteMutation.isPending}
        cancelButtonProps={{ disabled: bulkDeleteMutation.isPending }}
        onOk={() => bulkDeleteMutation.mutate(selectedKeys)}
        onCancel={() => !bulkDeleteMutation.isPending && setBulkDeleteOpen(false)}
        maskClosable={!bulkDeleteMutation.isPending}
      >
        <p>
          This permanently removes the selected reports and their findings, including any selected on other pages. This can&apos;t be
          undone.
        </p>
      </Modal>
    </div>
  );
}
