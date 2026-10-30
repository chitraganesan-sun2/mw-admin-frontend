"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Alert, Button, Empty, Select, Skeleton, Spin } from "antd";
import { FiMinus, FiPlus, FiTrendingDown, FiTrendingUp, FiX } from "react-icons/fi";
import { getSafetyReport, listSafetyReports } from "@/api/safety";
import { showToast } from "@/components/common/Toast";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import SafetyTabs from "@/components/safety/SafetyTabs";
import { SeverityTag, StatusTag } from "@/components/safety/SeverityTag";
import { categoryLabel, formatRisk, isSafetySeverity } from "@/components/safety/severity";
import { normalizeSeverity, riskColor } from "@/components/safety/analytics/analyticsData";

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_REPORTS = 6;
const MIN_SLOTS = 2;
const OPTIONS_LIMIT = 200; // the list is a picker; the API allows up to 500
const MAX_CATEGORIES = 10;
const EVIDENCE_PER_REPORT = 3;
const LETTERS = ["A", "B", "C", "D", "E", "F"];
// One colour per slot, chosen to stay clear of the severity colours (green/blue/amber/orange/red).
const SLOT_COLORS = ["#6366F1", "#0EA5E9", "#8B5CF6", "#EC4899", "#14B8A6", "#64748B"];
const GRID = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))]";

// ── URL handling (?ids=1,2,3) ────────────────────────────────────────────────

/** Strict parse: positive whole numbers only, no duplicates, at most MAX_REPORTS. */
const parseIds = (raw: string | null): { ids: number[]; ignored: number } => {
  if (!raw) return { ids: [], ignored: 0 };
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const ids: number[] = [];
  parts.forEach((part) => {
    const id = /^\d+$/.test(part) ? Number(part) : NaN;
    if (Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
  });
  const kept = ids.slice(0, MAX_REPORTS);
  return { ids: kept, ignored: parts.length - kept.length };
};

type Slot = number | null;

const padSlots = (ids: number[]): Slot[] => {
  const slots: Slot[] = [...ids];
  while (slots.length < MIN_SLOTS) slots.push(null);
  return slots;
};

const filled = (slots: Slot[]): number[] => slots.filter((id): id is number => id !== null);

// ── Report helpers ───────────────────────────────────────────────────────────

const isCompleted = (report: { status?: string | null }) => String(report.status ?? "").toUpperCase() === "COMPLETED";

const statsOf = (report: SafetyReport) => (report.stats ?? {}) as Record<string, any>;

const categoryCounts = (report: SafetyReport): Record<string, number> => {
  const stats = statsOf(report);
  const source = stats.categories || stats.category_breakdown;
  const counts: Record<string, number> = {};
  if (source && typeof source === "object") {
    Object.entries(source).forEach(([key, value]) => {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) counts[key] = n;
    });
  }
  return counts;
};

const toSeverityName = (value: unknown): SafetySeverity | null => {
  const text = String(value ?? "").toLowerCase();
  return normalizeSeverity(text === "medium" ? "moderate" : text);
};

const optionLabel = (r: { id: number; filename: string; severity: string | null; risk_score: number | null }) =>
  `#${r.id} - ${r.filename} (${r.severity ?? "No severity"}, ${formatRisk(r.risk_score)})`;

const count = (items: unknown): number => (Array.isArray(items) ? items.length : 0);

type Column = {
  id: number;
  slotIndex: number;
  letter: string;
  color: string;
  report?: SafetyReport;
  isLoading: boolean;
  error: unknown;
  retry: () => void;
};

// ── Presentational pieces ────────────────────────────────────────────────────

const Swatch = ({ color }: { color: string }) => (
  <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
);

const Diff = ({ value, unit, baseline, decimals = 0 }: { value: number; unit: string; baseline: string; decimals?: number }) => {
  const diff = value;
  const Icon = diff > 0 ? FiTrendingUp : diff < 0 ? FiTrendingDown : FiMinus;
  const color = diff > 0 ? "text-[#C2410C]" : diff < 0 ? "text-success" : "text-gray-medium";
  const text = diff === 0 ? "No change" : `${diff > 0 ? "+" : ""}${diff.toFixed(decimals)}`;
  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      <Icon aria-hidden="true" size={13} />
      <span className="font-medium">{text}</span>
      <span className="text-gray-medium">
        {unit} vs {baseline}
      </span>
    </div>
  );
};

const ScoreCard = ({ column, baseline }: { column: Column; baseline?: Column }) => {
  const report = column.report as SafetyReport;
  const score = typeof report.risk_score === "number" ? report.risk_score : null;
  const base = baseline?.report;
  const showDiff = base && baseline && baseline.id !== column.id;
  return (
    <div className="bg-white rounded-xl p-5 flex flex-col items-center text-center min-w-0" style={{ borderTop: `4px solid ${column.color}` }}>
      <p className="text-xs text-gray-medium m-0 flex items-center gap-1.5">
        <Swatch color={column.color} />
        Report {column.letter} - #{report.id}
      </p>
      <h3 className="text-sm font-semibold my-2 w-full truncate" title={report.filename}>
        <Link href={`/safety/report/${report.id}`} className="text-dark hover:underline">
          {report.filename}
        </Link>
      </h3>
      <div className="text-5xl font-extrabold leading-none" style={{ color: score === null ? undefined : riskColor(score) }}>
        {score === null ? "-" : Math.round(score)}
      </div>
      <div className="text-xs text-gray-medium mt-1">Risk score (out of 100)</div>
      <div className="mt-3">
        <SeverityTag severity={report.severity} />
      </div>
      <div className="text-xs text-gray-medium mt-2">{formatDisplayDateTime(report.created_at)}</div>
      {showDiff ? (
        <div className="mt-4 pt-3 border-t border-stroke w-full flex flex-col gap-1 items-start">
          <Diff value={(score ?? 0) - (base.risk_score ?? 0)} unit="score" baseline={baseline.letter} decimals={1} />
          <Diff value={count(report.findings) - count(base.findings)} unit="findings" baseline={baseline.letter} />
          <Diff value={count(report.evidence) - count(base.evidence)} unit="evidence" baseline={baseline.letter} />
        </div>
      ) : null}
    </div>
  );
};

const ColumnHead = ({ column }: { column: Column }) => (
  <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-medium border-b border-stroke">
    <span className="inline-flex items-center gap-1.5 justify-center">
      <Swatch color={column.color} />
      Report {column.letter}
    </span>
  </th>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-xl p-5 min-w-0">
    <h3 className="text-base font-semibold m-0 mb-4">{title}</h3>
    {children}
  </section>
);

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SafetyComparePage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  useEffect(() => {
    setHeaderOptions({ title: "Safety Monitoring", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  // The selection lives in the URL so a comparison can be shared as a link.
  const [idsParam, setIdsParam] = useQueryState("ids", parseAsString);
  const parsed = useMemo(() => parseIds(idsParam), [idsParam]);
  const urlKey = parsed.ids.join(",");

  const [slots, setSlots] = useState<Slot[]>(() => padSlots(parsed.ids));

  // Follow the URL when it changes from outside (a pasted or followed link).
  useEffect(() => {
    if (filled(slots).join(",") !== urlKey) setSlots(padSlots(parsed.ids));
    // Only a URL change should re-sync; edits made here already write the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  const updateSlots = (next: Slot[]) => {
    setSlots(next);
    const ids = filled(next);
    setIdsParam(ids.length ? ids.join(",") : null);
  };

  const selectedIds = useMemo(() => filled(slots), [slots]);

  // Picker list: completed reports only.
  const listQuery = useQuery({
    queryKey: ["safety-compare-options", OPTIONS_LIMIT],
    queryFn: () => listSafetyReports({ limit: OPTIONS_LIMIT }),
  });
  const completedRows = useMemo(
    () => (listQuery.data?.reports ?? []).filter((r) => isCompleted(r) && typeof r.risk_score === "number"),
    [listQuery.data]
  );

  useEffect(() => {
    if (listQuery.error) {
      showToast({ type: "error", message: getApiErrorMessage(listQuery.error, "Couldn't load the report list.") });
    }
  }, [listQuery.error]);

  // Each selected report, loaded in parallel.
  const reportQueries = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: ["safety-compare-report", id],
      queryFn: () => getSafetyReport(id),
    })),
  });

  const columns = useMemo<Column[]>(
    () =>
      slots.flatMap((id, slotIndex) => {
        if (id === null) return [];
        const query = reportQueries[selectedIds.indexOf(id)];
        return [
          {
            id,
            slotIndex,
            letter: LETTERS[slotIndex],
            color: SLOT_COLORS[slotIndex],
            report: query?.data,
            isLoading: !!query && query.isLoading,
            error: query?.error ?? null,
            retry: () => {
              query?.refetch();
            },
          },
        ];
      }),
    [slots, selectedIds, reportQueries]
  );

  const ready = columns.filter((c) => c.report && isCompleted(c.report));
  const problems = columns.filter((c) => !c.isLoading && (!c.report || !isCompleted(c.report)));
  const anyLoading = columns.some((c) => c.isLoading);
  const baseline = ready[0];

  const options = useMemo(() => {
    const byId = new Map<number, { value: number; label: string }>();
    completedRows.forEach((r) => byId.set(r.id, { value: r.id, label: optionLabel(r) }));
    // A report opened from a link may be older than the picker list; keep its label readable.
    columns.forEach((c) => {
      if (c.report && !byId.has(c.id)) byId.set(c.id, { value: c.id, label: optionLabel(c.report) });
    });
    return [...byId.values()];
  }, [completedRows, columns]);

  const setSlot = (index: number, id: number | null | undefined) => {
    const next = [...slots];
    next[index] = id ?? null;
    updateSlots(next);
  };

  const removeSlot = (index: number) => updateSlots(slots.filter((_, i) => i !== index));
  const addSlot = () => setSlots((current) => (current.length < MAX_REPORTS ? [...current, null] : current));

  // ── Comparison data ────────────────────────────────────────────────────────
  const metricRows = useMemo(() => {
    const rows: Array<{ label: string; cells: React.ReactNode[] }> = [
      { label: "Risk score", cells: ready.map((c) => formatRisk(c.report?.risk_score)) },
      { label: "Severity", cells: ready.map((c) => <SeverityTag key={c.id} severity={c.report?.severity} />) },
      { label: "Total findings", cells: ready.map((c) => count(c.report?.findings)) },
      { label: "Evidence items", cells: ready.map((c) => count(c.report?.evidence)) },
      {
        label: "Categories detected",
        cells: ready.map((c) => {
          const stats = statsOf(c.report as SafetyReport);
          return typeof stats.unique_categories === "number"
            ? stats.unique_categories
            : Object.keys(categoryCounts(c.report as SafetyReport)).length;
        }),
      },
      {
        label: "Average confidence",
        cells: ready.map((c) => {
          const average = statsOf(c.report as SafetyReport).confidence_stats?.average;
          return typeof average === "number" ? `${(average * 100).toFixed(0)}%` : "-";
        }),
      },
      {
        label: "Words analysed",
        cells: ready.map((c) => {
          const words = statsOf(c.report as SafetyReport).word_count;
          return typeof words === "number" ? words.toLocaleString() : "-";
        }),
      },
      { label: "Timeline segments", cells: ready.map((c) => count(c.report?.timeline)) },
      { label: "Analysed", cells: ready.map((c) => formatDisplayDateTime(c.report?.created_at)) },
    ];
    return rows;
  }, [ready]);

  const categoryRows = useMemo(() => {
    const perReport = ready.map((c) => categoryCounts(c.report as SafetyReport));
    const keys = new Set<string>();
    perReport.forEach((counts) => Object.keys(counts).forEach((key) => keys.add(key)));
    const rows = [...keys].map((key) => ({
      key,
      label: categoryLabel(key),
      values: perReport.map((counts) => counts[key] ?? 0),
    }));
    rows.sort((a, b) => Math.max(...b.values) - Math.max(...a.values));
    return { shown: rows.slice(0, MAX_CATEGORIES), total: rows.length };
  }, [ready]);

  const evidenceByReport = useMemo(
    () =>
      ready.map((c) =>
        [...(c.report?.evidence ?? [])]
          .sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0))
          .slice(0, EVIDENCE_PER_REPORT)
      ),
    [ready]
  );

  const canAdd = slots.length < MAX_REPORTS;

  return (
    <div className="p-6">
      <SafetyTabs />

      <div className="mb-5">
        <h2 className="text-lg font-semibold m-0">Compare reports</h2>
        <p className="text-sm text-gray-medium m-0">
          Pick two to {MAX_REPORTS} completed reports to compare them side by side. The selection is saved in the page link.
        </p>
      </div>

      <section aria-label="Choose reports" className="bg-white rounded-xl p-5 mb-5">
        <div className={GRID}>
          {slots.map((id, index) => {
            const fieldId = `compare-report-${index}`;
            return (
              <div key={index} className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-1.5">
                    <Swatch color={SLOT_COLORS[index]} />
                    Report {LETTERS[index]}
                  </label>
                  {slots.length > MIN_SLOTS ? (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      aria-label={`Remove report ${LETTERS[index]}`}
                      className="text-gray-medium hover:text-dark p-1 rounded"
                    >
                      <FiX aria-hidden="true" size={14} />
                    </button>
                  ) : null}
                </div>
                <Select
                  id={fieldId}
                  showSearch
                  allowClear
                  className="w-full"
                  placeholder="Select a report"
                  loading={listQuery.isLoading}
                  value={id ?? undefined}
                  onChange={(value) => setSlot(index, value)}
                  optionFilterProp="label"
                  options={options.map((o) => ({ ...o, disabled: selectedIds.includes(o.value) && o.value !== id }))}
                  notFoundContent={listQuery.isLoading ? "Loading reports..." : "No completed reports found"}
                />
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button icon={<FiPlus aria-hidden="true" />} disabled={!canAdd} onClick={addSlot}>
            Add another report
          </Button>
          {selectedIds.length > 0 ? (
            <Button type="text" onClick={() => updateSlots(padSlots([]))}>
              Clear selection
            </Button>
          ) : null}
          {listQuery.data && listQuery.data.total > listQuery.data.reports.length ? (
            <span className="text-xs text-gray-medium">
              Showing the {listQuery.data.reports.length} most recent of {listQuery.data.total} reports.
            </span>
          ) : null}
        </div>

        {listQuery.isError && !listQuery.data ? (
          <Alert
            className="mt-4"
            type="error"
            showIcon
            message={getApiErrorMessage(listQuery.error, "Couldn't load the report list.")}
            action={
              <Button size="small" onClick={() => listQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : null}
        {parsed.ignored > 0 ? (
          <Alert
            className="mt-4"
            type="warning"
            showIcon
            message={`${parsed.ignored} report ID${parsed.ignored === 1 ? "" : "s"} in the link ${
              parsed.ignored === 1 ? "was" : "were"
            } ignored. Only positive whole numbers are accepted, up to ${MAX_REPORTS} reports.`}
          />
        ) : null}
      </section>

      {problems.length > 0 ? (
        <div className="space-y-3 mb-5">
          {problems.map((c) => (
            <Alert
              key={c.id}
              type={c.report ? "warning" : "error"}
              showIcon
              message={
                c.report ? (
                  <span>
                    Report {c.letter} (#{c.id}) isn&apos;t included: its analysis is{" "}
                    <StatusTag status={c.report.status} />
                    {c.report.error_message ? ` - ${c.report.error_message}` : ""}
                  </span>
                ) : (
                  `Couldn't load report ${c.letter} (#${c.id}). ${getApiErrorMessage(
                    c.error,
                    "It may have been deleted, or the safety service isn't responding."
                  )}`
                )
              }
              action={
                <div className="flex gap-2">
                  {!c.report ? (
                    <Button size="small" onClick={c.retry}>
                      Try again
                    </Button>
                  ) : null}
                  <Button size="small" onClick={() => removeSlot(c.slotIndex)}>
                    Remove
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      ) : null}

      {ready.length >= 2 ? (
        <div className="space-y-5">
          <section aria-label="Risk scores" className={GRID}>
            {ready.map((c) => (
              <ScoreCard key={c.id} column={c} baseline={baseline} />
            ))}
          </section>

          <Section title="Metrics comparison">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-medium border-b border-stroke">
                      Metric
                    </th>
                    {ready.map((c) => (
                      <ColumnHead key={c.id} column={c} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricRows.map((row) => (
                    <tr key={row.label} className="border-b border-stroke last:border-b-0">
                      <th scope="row" className="px-3 py-2 text-left font-medium">
                        {row.label}
                      </th>
                      {row.cells.map((cell, i) => (
                        <td key={ready[i].id} className="px-3 py-2 text-center">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Category breakdown">
            {categoryRows.shown.length === 0 ? (
              <p className="text-sm text-gray-medium m-0">None of the selected reports has detected categories.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">Findings per category in each selected report</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-medium border-b border-stroke">
                          Category
                        </th>
                        {ready.map((c) => (
                          <ColumnHead key={c.id} column={c} />
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRows.shown.map((row) => {
                        const max = Math.max(...row.values, 1);
                        return (
                          <tr key={row.key} className="border-b border-stroke last:border-b-0">
                            <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">
                              {row.label}
                            </th>
                            {row.values.map((value, i) => (
                              <td key={ready[i].id} className="px-3 py-2 min-w-[110px]">
                                <div className="flex items-center gap-2">
                                  <div aria-hidden="true" className="h-2 flex-1 rounded bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full rounded"
                                      style={{ width: `${(value / max) * 100}%`, background: ready[i].color }}
                                    />
                                  </div>
                                  <span className="w-6 text-right text-xs font-semibold">{value}</span>
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {categoryRows.total > categoryRows.shown.length ? (
                  <p className="text-xs text-gray-medium mt-3 mb-0">
                    Showing the top {categoryRows.shown.length} of {categoryRows.total} categories.
                  </p>
                ) : null}
              </>
            )}
          </Section>

          <Section title="Key evidence">
            <p className="text-xs text-gray-medium mt-0 mb-4">
              The {EVIDENCE_PER_REPORT} highest-confidence passages from each report.
            </p>
            <div className={GRID}>
              {ready.map((c, i) => (
                <div key={c.id} className="min-w-0">
                  <h4 className="text-sm font-semibold m-0 mb-2 flex items-center gap-1.5">
                    <Swatch color={c.color} />
                    Report {c.letter}
                  </h4>
                  {evidenceByReport[i].length === 0 ? (
                    <p className="text-sm text-gray-medium m-0">No evidence recorded.</p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-3">
                      {evidenceByReport[i].map((item, j) => {
                        const severity = toSeverityName(item.severity);
                        return (
                          <li key={j} className="rounded-lg border border-stroke p-3">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {severity && isSafetySeverity(severity) ? <SeverityTag severity={severity} /> : null}
                              <span className="text-xs font-medium">{categoryLabel(String(item.category ?? ""))}</span>
                              {typeof item.confidence === "number" ? (
                                <span className="text-xs text-gray-medium">{Math.round(item.confidence * 100)}% confidence</span>
                              ) : null}
                            </div>
                            <blockquote className="m-0 text-sm text-gray-medium break-words">
                              {item.speaker ? <strong className="text-dark">{item.speaker}: </strong> : null}
                              {item.evidence}
                            </blockquote>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      ) : anyLoading ? (
        <div aria-busy="true" className="bg-white rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          <Spin />
          <p className="text-sm text-gray-medium m-0">Loading reports...</p>
          <div className="w-full max-w-md">
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
        </div>
      ) : problems.length > 0 ? null : (
        <div className="bg-white rounded-xl p-10">
          <Empty
            description={
              listQuery.isSuccess && completedRows.length === 0 && selectedIds.length === 0
                ? "There are no completed reports to compare yet."
                : "Select at least two completed reports above to compare them side by side."
            }
          >
            {listQuery.isSuccess && completedRows.length === 0 && selectedIds.length === 0 ? (
              <Link href="/safety/upload">
                <Button type="primary">Start a new analysis</Button>
              </Link>
            ) : null}
          </Empty>
        </div>
      )}

      {problems.length > 0 && ready.length < 2 && !anyLoading ? (
        <p className="text-sm text-gray-medium">Fix or replace the reports above to see a comparison.</p>
      ) : null}
    </div>
  );
}
