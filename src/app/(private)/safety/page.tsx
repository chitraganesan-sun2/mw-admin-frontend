"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Checkbox, Input, Modal, Pagination, Select, Skeleton, Table, Tooltip } from "antd";
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
  FiFilter,
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
import { RiskMeter, SeverityBadge, StatusBadge } from "@/components/safety/ui/Badges";
import { Panel } from "@/components/safety/ui/Panel";
import { LiveStatus, SafetyPage } from "@/components/safety/ui/SafetyPage";
import { StatCard } from "@/components/safety/ui/StatCard";
import {
  SEVERITY_COLORS,
  SEVERITY_ORDER,
  SEVERITY_TONE,
  STATUS_LABELS,
  formatRisk,
  isInFlight,
  needsAttention,
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
  const [filtersOpen, setFiltersOpen] = useState(false); // phones only: the filters fold away to save room
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
  const activeFilterCount = [
    search.trim() !== "",
    debouncedSession !== "",
    severityFilter !== "all",
    statusFilter !== "all",
    datePreset !== "all",
  ].filter(Boolean).length;

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

  const toggleSelected = (id: number, checked: boolean) =>
    setSelectedKeys((keys) => (checked ? (keys.includes(id) ? keys : [...keys, id]) : keys.filter((k) => k !== id)));

  const linkEntries = (record: SafetyReportRow) =>
    [
      ["Session", record.session_id],
      ["Volunteer", record.volunteer_id],
      ["Learner", record.learner_id],
    ].filter(([, value]) => value) as [string, string][];

  // Date over time on two lines, so the column stays narrow enough for the whole table to fit.
  const DateCell = ({ value }: { value: string | null }) => {
    const [day, time] = (formatDisplayDateTime(value) || "").split(", ");
    return (
      <span className="block whitespace-nowrap text-xs leading-snug text-[#4F4F4F]">
        <span className="block text-dark">{day || "–"}</span>
        {time ? <span className="block">{time}</span> : null}
      </span>
    );
  };

  const RowActions = ({ record }: { record: SafetyReportRow }) => (
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
  );

  const columns: TableColumnsType<SafetyReportRow> = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 72,
        sorter: (a, b) => a.id - b.id,
        render: (id: number) => <span className="font-mono text-xs text-[#4F4F4F]">#{id}</span>,
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
            className="block max-w-[190px] truncate font-medium text-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary xl:max-w-[260px]"
          >
            {filename || "Untitled"}
          </Link>
        ),
      },
      {
        title: "Risk",
        dataIndex: "risk_score",
        key: "risk_score",
        width: 118,
        sorter: (a, b) => (a.risk_score ?? -1) - (b.risk_score ?? -1),
        render: (score: number | null) => <RiskMeter score={score} />,
      },
      {
        title: "Severity",
        dataIndex: "severity",
        key: "severity",
        width: 116,
        sorter: (a, b) => severityRank(a.severity) - severityRank(b.severity),
        render: (severity: string | null) => <SeverityBadge severity={severity} />,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 124,
        render: (status: string) => <StatusBadge status={status} />,
      },
      {
        title: "Linked to",
        key: "links",
        width: 150,
        responsive: ["xl"],
        render: (_: unknown, record) => {
          const links = linkEntries(record);
          if (!links.length) return <span className="text-[#6B7280]">–</span>;
          return (
            <div className="flex flex-col gap-0.5 text-xs text-[#4F4F4F]">
              {links.map(([label, value]) => (
                <Tooltip key={label} title={`${label} ID: ${value}`}>
                  <span className="block max-w-[140px] truncate">
                    <span className="text-[#6B7280]">{label}:</span> {value}
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
        width: 118,
        sorter: (a, b) => dayjs(a.created_at ?? 0).valueOf() - dayjs(b.created_at ?? 0).valueOf(),
        render: (value: string | null) => <DateCell value={value} />,
      },
      {
        title: "Actions",
        key: "actions",
        width: 96,
        fixed: "right",
        render: (_: unknown, record) => <RowActions record={record} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [downloadingId, handleDownloadPdf]
  );

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <FiShield className="text-3xl text-gray-300" aria-hidden />
      {anyFilterActive ? (
        <>
          <p className="m-0 font-medium text-dark">
            {rows.length === 0 && debouncedSession ? "No reports found for this session" : "No reports match your filters"}
          </p>
          <p className="m-0 max-w-sm text-sm text-[#4F4F4F]">
            {clientFilterActive && rows.length > 0
              ? "Search, severity, status and date only look at the reports loaded on this page. Try another page or a larger page size."
              : "Try a different session ID, or clear the filters."}
          </p>
          <Button onClick={clearFilters}>Clear filters</Button>
        </>
      ) : (
        <>
          <p className="m-0 font-medium text-dark">No reports yet</p>
          <p className="m-0 max-w-sm text-sm text-[#4F4F4F]">
            Analyze a call recording, video or transcript to see its safety report here.
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

  const controlLabel = "mb-1 block text-xs font-medium text-[#4F4F4F]";
  const selectedCount = selectedKeys.length;
  const analysingCount = rows.filter((r) => isInFlight(r.status)).length;
  const updatedAt = reportsQuery.dataUpdatedAt ? dayjs(reportsQuery.dataUpdatedAt).format("h:mm:ss A") : null;
  const tableLoading = reportsQuery.isLoading || (reportsQuery.isFetching && reportsQuery.isPlaceholderData);

  const handlePageChange = (nextPage: number, nextSize?: number) => {
    if (nextSize && nextSize !== pageSize) {
      setPageSize(nextSize);
      setPage(1);
    } else {
      setPage(nextPage);
    }
  };

  // Phones: one card per report, with the facts an admin triages on (severity, risk, status) up front.
  const reportCards = (
    <div className="md:hidden" aria-busy={tableLoading}>
      {tableLoading && !filteredRows.length ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-stroke p-4">
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        emptyState
      ) : (
        <ul className="m-0 list-none space-y-3 p-0" aria-label="Reports">
          {filteredRows.map((record) => {
            const links = linkEntries(record);
            const attention = needsAttention(record.severity);
            return (
              <li
                key={record.id}
                className={`rounded-2xl border bg-white p-3.5 ${attention ? "border-l-4" : "border-stroke"}`}
                style={
                  attention
                    ? { borderColor: "#E0E0E0", borderLeftColor: SEVERITY_TONE[record.severity as SafetySeverity].dot }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedKeys.includes(record.id)}
                    onChange={(e) => toggleSelected(record.id, e.target.checked)}
                    aria-label={`Select report ${record.id}`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/safety/report/${record.id}`}
                      className="block break-words font-medium leading-snug text-dark hover:underline"
                    >
                      {record.filename || "Untitled"}
                    </Link>
                    <p className="m-0 mt-0.5 text-xs text-[#4F4F4F]">
                      #{record.id} · {formatDisplayDateTime(record.created_at) || "–"}
                    </p>
                  </div>
                  <SeverityBadge severity={record.severity} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-8">
                  <RiskMeter score={record.risk_score} barClassName="w-24" />
                  <StatusBadge status={record.status} />
                </div>
                {links.length ? (
                  <p className="m-0 mt-2 break-words pl-8 text-xs text-[#4F4F4F]">
                    {links.map(([label, value]) => `${label}: ${value}`).join(" · ")}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF1F5] pt-2.5 pl-8">
                  <Link
                    href={`/safety/report/${record.id}`}
                    className="inline-flex min-h-[40px] items-center text-sm font-medium text-[#046A8A] hover:underline"
                  >
                    Open report
                  </Link>
                  <RowActions record={record} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {reportsQuery.data && total > 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Pagination
            simple
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={(p) => handlePageChange(p)}
          />
          <p className="m-0 text-xs text-[#4F4F4F]" aria-live="polite">
            {total} {total === 1 ? "report" : "reports"} in total
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <SafetyPage
      title="Reports"
      description="Every analysis, newest first. High and Critical reports are marked so they stand out. Open any row for its full report."
      status={<LiveStatus analysing={analysingCount} updatedAt={updatedAt} />}
      actions={
        <>
          <Button icon={<FiRefreshCw className={reportsQuery.isFetching ? "animate-spin" : ""} />} onClick={refreshAll}>
            Refresh
          </Button>
          <Link href="/safety/upload">
            <Button type="primary" icon={<FiPlus />}>
              New analysis
            </Button>
          </Link>
        </>
      }
    >
      {/* KPI cards + severity chart */}
      {analyticsQuery.isError && !analytics ? (
        <Alert
          type="error"
          showIcon
          message="Couldn't load the summary figures. Please try again."
          action={
            <Button size="small" onClick={() => analyticsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3 sm:gap-4">
            {analyticsQuery.isLoading || !analytics ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-stroke bg-white p-4">
                  <Skeleton active paragraph={{ rows: 1 }} />
                </div>
              ))
            ) : (
              <>
                <StatCard
                  label="Needs attention"
                  value={highRisk}
                  hint={highRisk > 0 ? `High or Critical · ${percent(highRisk, analysed)} of analyzed` : "No High or Critical reports"}
                  icon={<FiAlertTriangle size={16} />}
                  tone={highRisk > 0 ? "danger" : "good"}
                  emphasis={highRisk > 0}
                />
                <StatCard
                  label="Analyzed reports"
                  value={analysed}
                  hint="completed analyses"
                  icon={<FiFileText size={16} />}
                  tone="info"
                />
                <StatCard
                  label="Average risk score"
                  value={formatRisk(analytics.avg_risk_score)}
                  hint="out of 100"
                  icon={<FiBarChart2 size={16} />}
                />
                <StatCard
                  label="Safe / low risk"
                  value={safeLow}
                  hint={`${percent(safeLow, analysed)} of analyzed`}
                  icon={<FiCheckCircle size={16} />}
                  tone="good"
                />
                <StatCard
                  label="Total findings"
                  value={analytics.total_findings ?? 0}
                  hint="across all reports"
                  icon={<FiActivity size={16} />}
                />
                <StatCard
                  label="High-confidence detections"
                  value={analytics.high_confidence_count ?? 0}
                  hint={
                    analytics.total_findings
                      ? `${percent(analytics.high_confidence_count ?? 0, analytics.total_findings)} of all findings`
                      : "findings with 75% confidence or more"
                  }
                  icon={<FiCpu size={16} />}
                />
              </>
            )}
          </div>

          <Panel title="Severity distribution" id="safety-severity-chart">
            {analyticsQuery.isLoading || !analytics ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : chartSeverities.length === 0 ? (
              <p className="m-0 py-10 text-center text-sm text-[#4F4F4F]">No analyzed reports yet.</p>
            ) : (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
                <div className="w-full max-w-[200px] shrink-0">
                  <Chart
                    options={chartOptions}
                    series={chartSeverities.map((s) => counts[s])}
                    type="donut"
                    height={190}
                  />
                </div>
                <ul className="m-0 grid w-full list-none grid-cols-1 gap-y-1.5 p-0 text-sm text-[#4F4F4F]">
                  {SEVERITY_ORDER.slice()
                    .reverse()
                    .map((s) => (
                      <li key={s} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: SEVERITY_COLORS[s].hex }}
                            aria-hidden
                          />
                          {s}
                        </span>
                        <span className="tabular-nums font-medium text-dark">
                          {counts[s]}
                          <span className="ml-1.5 text-xs font-normal text-[#6B7280]">{percent(counts[s], analysed)}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* History */}
      <Panel
        id="safety-history"
        aria-label="Analysis history"
        title="Analysis history"
        description={
          reportsQuery.data
            ? clientFilterActive
              ? `Showing ${filteredRows.length} of ${rows.length} reports on this page (${total} in total). Search, severity, status and date filter this page only.`
              : `${total} ${total === 1 ? "report" : "reports"}${debouncedSession ? " for this session" : ""}`
            : undefined
        }
        actions={
          selectedCount === 0 ? (
            <Button icon={<FiDownload />} onClick={handleExport} disabled={!filteredRows.length}>
              Export CSV
            </Button>
          ) : undefined
        }
      >
        <div className="mb-3 md:hidden">
          <Button
            block
            icon={<FiFilter />}
            aria-expanded={filtersOpen}
            aria-controls="safety-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {filtersOpen ? "Hide filters" : "Filters"}
            {activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}
          </Button>
        </div>
        <div
          id="safety-filters"
          className={`mb-4 grid-cols-2 gap-3 md:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end ${
            filtersOpen ? "grid" : "hidden"
          }`}
        >
          <div className="col-span-2 lg:col-span-1">
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
          <div className="col-span-2 lg:col-span-1">
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
          <div>
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
          <div>
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
          <div className="col-span-2 lg:col-span-1">
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
            <div className="col-span-2 lg:col-span-1">
              <Button className="w-full lg:w-auto" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {selectedCount > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2"
            role="region"
            aria-label="Selected reports"
          >
            <span className="text-sm font-medium text-dark">{selectedCount} selected</span>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCount === 2 && (
                <Button icon={<FiGitMerge />} onClick={() => router.push(`/safety/compare?ids=${selectedKeys.join(",")}`)}>
                  Compare
                </Button>
              )}
              <Button icon={<FiDownload />} onClick={handleExport}>
                Export selected
              </Button>
              <Button danger icon={<FiTrash2 />} onClick={() => setBulkDeleteOpen(true)}>
                Delete selected
              </Button>
              <Button type="text" icon={<FiX />} aria-label="Clear selection" onClick={() => setSelectedKeys([])} />
            </div>
          </div>
        )}

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
            <p className="m-0 font-medium text-dark">Couldn&apos;t load the reports.</p>
            <p className="m-0 max-w-sm text-sm text-[#4F4F4F]">
              {getApiErrorMessage(reportsQuery.error, "The safety service may be unavailable. Please try again.")}
            </p>
            <Button type="primary" icon={<FiRefreshCw />} onClick={() => reportsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {reportCards}
            <div className="hidden md:block">
              <Table<SafetyReportRow>
                rowKey="id"
                columns={columns}
                dataSource={filteredRows}
                loading={tableLoading}
                scroll={{ x: 760 }}
                locale={{ emptyText: emptyState }}
                rowClassName={(record) =>
                  record.severity === "Critical"
                    ? "[&>td:first-child]:shadow-[inset_3px_0_0_#EF4444]"
                    : record.severity === "High"
                      ? "[&>td:first-child]:shadow-[inset_3px_0_0_#F97316]"
                      : ""
                }
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
                  itemRender: (_page, type, original) =>
                    type === "prev" || type === "next"
                      ? React.cloneElement(original as React.ReactElement<{ "aria-label"?: string }>, {
                          "aria-label": type === "prev" ? "Previous page" : "Next page",
                        })
                      : original,
                }}
                onChange={(pagination) => handlePageChange(pagination.current ?? 1, pagination.pageSize)}
              />
            </div>
          </>
        )}
      </Panel>

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
    </SafetyPage>
  );
}
