"use client";

import { useMemo } from "react";
import { FiActivity, FiBarChart2, FiClock, FiCpu, FiDatabase, FiPieChart } from "react-icons/fi";
import { SEVERITY_COLORS, SEVERITY_ORDER, categoryLabel } from "../severity";
import { Chart, ChartCard } from "./Chart";
import {
  CHARTED_STAT_KEYS,
  HIGH_CONFIDENCE,
  ReportModel,
  buildConfidenceHistogram,
  buildMlAgreement,
  fmtPct,
  normalizeSeverity,
  numericRecord,
} from "./helpers";
import { DetailRow, Panel } from "./parts";

const CONFIDENCE_COLORS = ["#9CA3AF", "#3B82F6", "#F59E0B", "#F97316"];
const PHASE_COLORS = ["#10B981", "#F59E0B", "#F97316"];
const PHASES = [
  { key: "early", label: "Early (0-25%)" },
  { key: "middle", label: "Middle (25-75%)" },
  { key: "late", label: "Late (75-100%)" },
] as const;

const describe = (labels: string[], values: number[]) => labels.map((l, i) => `${l} ${values[i]}`).join(", ");

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-2xl font-semibold text-gray-800">{value}</dd>
      {hint && <dd className="text-xs text-gray-400">{hint}</dd>}
    </div>
  );
}

export default function AnalyticsTab({ report, model }: { report: SafetyReport; model: ReportModel }) {
  const { findings, stats, categoryCounts, timeline } = model;

  const derived = useMemo(() => {
    // Severity: the stats object keys it in lower case ("critical"), the findings in whatever the pipeline sent.
    const severityCounts: Partial<Record<SafetySeverity, number>> = {};
    const fromStats = numericRecord(stats.severity_distribution);
    if (Object.keys(fromStats).length) {
      Object.entries(fromStats).forEach(([k, v]) => {
        const sev = normalizeSeverity(k);
        if (sev) severityCounts[sev] = (severityCounts[sev] ?? 0) + v;
      });
    } else {
      findings.forEach((f) => f.severity && (severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1));
    }
    const severity = SEVERITY_ORDER.filter((s) => (severityCounts[s] ?? 0) > 0).map((s) => ({ label: s, value: severityCounts[s] as number }));

    let ctx = numericRecord(stats.context_type_distribution);
    if (!Object.keys(ctx).length) {
      ctx = {};
      findings.forEach((f) => f.contextType && (ctx[f.contextType] = (ctx[f.contextType] ?? 0) + 1));
    }
    const context = Object.entries(ctx)
      .map(([label, value]) => ({ label: categoryLabel(label.toLowerCase()), value }))
      .sort((a, b) => b.value - a.value);

    // Where in the conversation findings fall. Positions are seconds (audio/video) or sentence indexes (text).
    const timelineEnd = Math.max(0, ...timeline.map((s) => (typeof s.end === "number" ? s.end : 0)));
    const positions = findings.map((f) => f.timestamp).filter((t): t is number => t != null);
    const total = Math.max(timelineEnd, ...positions, 0);
    const phaseCounts = { early: 0, middle: 0, late: 0 };
    let placed = 0;
    findings.forEach((f) => {
      const phase = f.phase ?? (f.timestamp != null && total > 0 ? (f.timestamp / total <= 0.25 ? "early" : f.timestamp / total <= 0.75 ? "middle" : "late") : undefined);
      if (phase) {
        phaseCounts[phase] += 1;
        placed += 1;
      }
    });

    const scatter = findings
      .filter((f) => f.timestamp != null)
      .map((f) => [Number((f.timestamp as number).toFixed(1)), Number(f.confidence.toFixed(3))]);

    return {
      severity,
      context,
      phaseCounts,
      phasePlaced: placed,
      scatter,
      histogram: buildConfidenceHistogram(findings, stats.confidence_histogram),
      ml: buildMlAgreement(findings, stats.ml_stats),
    };
  }, [findings, stats, timeline]);

  const confidenceStats = numericRecord(stats.confidence_stats);
  const highConfidence = typeof stats.high_confidence_count === "number" ? stats.high_confidence_count : findings.filter((f) => f.confidence >= HIGH_CONFIDENCE).length;
  const wordCount = typeof stats.word_count === "number" ? stats.word_count : null;
  const uniqueCategories = typeof stats.unique_categories === "number" ? stats.unique_categories : categoryCounts.length;
  const flaggedSentences = typeof stats.flagged_sentences === "number" ? stats.flagged_sentences : findings.length;

  const radar = categoryCounts.slice(0, 6);
  const phaseValues = [derived.phaseCounts.early, derived.phaseCounts.middle, derived.phaseCounts.late];
  const otherStats = Object.entries(stats).filter(([k]) => !CHARTED_STAT_KEYS.includes(k));
  const hasAnything = findings.length > 0 || categoryCounts.length > 0 || otherStats.length > 0;

  if (!hasAnything) {
    return <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">No statistics were produced for this report.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label="Risk score" value={report.risk_score != null ? report.risk_score.toFixed(1) : "-"} />
        <StatCard label="Words analysed" value={wordCount ?? "-"} />
        <StatCard label="Flagged sentences" value={flaggedSentences} />
        <StatCard label="Unique categories" value={uniqueCategories} />
        <StatCard label="High-confidence matches" value={highConfidence} hint="75% confidence or more" />
        {derived.ml && <StatCard label="ML disagreements" value={derived.ml.disagreed} />}
        <StatCard label="Average confidence" value={confidenceStats.average != null ? fmtPct(confidenceStats.average) : "-"} />
        {confidenceStats.maximum != null && (
          <StatCard
            label="Confidence range"
            value={`${fmtPct(confidenceStats.minimum, 0)} - ${fmtPct(confidenceStats.maximum, 0)}`}
            hint="lowest to highest"
          />
        )}
      </dl>

      <div className="grid md:grid-cols-2 gap-4">
        {radar.length > 2 && (
          <ChartCard title="Risk radar" icon={<FiActivity className="text-indigo-500" aria-hidden="true" />} note="Top categories by number of findings">
            <Chart
              type="radar"
              summary={`Radar of findings per category: ${describe(radar.map((r) => categoryLabel(r.category)), radar.map((r) => r.count))}`}
              series={[{ name: "Findings", data: radar.map((r) => r.count) }]}
              options={{
                chart: { type: "radar" },
                colors: ["#6366F1"],
                xaxis: { categories: radar.map((r) => categoryLabel(r.category).split(" ")[0]) },
                yaxis: { show: false },
                fill: { opacity: 0.25 },
                markers: { size: 3 },
              }}
            />
          </ChartCard>
        )}

        {derived.severity.length > 0 && (
          <ChartCard title="Severity distribution" icon={<FiPieChart className="text-indigo-500" aria-hidden="true" />}>
            <Chart
              type="donut"
              summary={`Findings by severity: ${describe(derived.severity.map((s) => s.label), derived.severity.map((s) => s.value))}`}
              series={derived.severity.map((s) => s.value)}
              options={{
                chart: { type: "donut" },
                labels: derived.severity.map((s) => s.label),
                colors: derived.severity.map((s) => SEVERITY_COLORS[s.label as SafetySeverity].hex),
                legend: { position: "bottom" },
                dataLabels: { enabled: true, formatter: (_v, opts) => String(opts.w.config.series[opts.seriesIndex]) },
                plotOptions: { pie: { donut: { size: "55%" } } },
              }}
            />
          </ChartCard>
        )}

        {derived.phasePlaced > 0 && (
          <ChartCard
            title="Findings by conversation phase"
            icon={<FiClock className="text-indigo-500" aria-hidden="true" />}
            note="Findings late in a conversation, after trust is built, can indicate escalation. Position is estimated from each finding's place in the conversation."
          >
            <Chart
              type="bar"
              summary={`Findings by conversation phase: ${describe(PHASES.map((p) => p.label), phaseValues)}`}
              series={[{ name: "Findings", data: phaseValues }]}
              options={{
                chart: { type: "bar" },
                colors: PHASE_COLORS,
                plotOptions: { bar: { distributed: true, borderRadius: 4 } },
                legend: { show: false },
                xaxis: { categories: PHASES.map((p) => p.label) },
                yaxis: { labels: { formatter: (v) => String(Math.round(v)) } },
              }}
            />
          </ChartCard>
        )}

        {derived.histogram.some((b) => b.count > 0) && (
          <ChartCard title="Confidence distribution" icon={<FiBarChart2 className="text-indigo-500" aria-hidden="true" />}>
            <Chart
              type="bar"
              summary={`Findings by confidence range: ${describe(derived.histogram.map((b) => `${b.range}%`), derived.histogram.map((b) => b.count))}`}
              series={[{ name: "Findings", data: derived.histogram.map((b) => b.count) }]}
              options={{
                chart: { type: "bar" },
                colors: CONFIDENCE_COLORS,
                plotOptions: { bar: { distributed: true, borderRadius: 4 } },
                legend: { show: false },
                xaxis: { categories: derived.histogram.map((b) => `${b.range}%`) },
                yaxis: { labels: { formatter: (v) => String(Math.round(v)) } },
              }}
            />
          </ChartCard>
        )}

        {derived.context.length > 0 && (
          <ChartCard title="Context types" icon={<FiBarChart2 className="text-indigo-500" aria-hidden="true" />}>
            <Chart
              type="bar"
              height={Math.max(220, derived.context.length * 38 + 60)}
              summary={`Findings by context type: ${describe(derived.context.map((c) => c.label), derived.context.map((c) => c.value))}`}
              series={[{ name: "Findings", data: derived.context.map((c) => c.value) }]}
              options={{
                chart: { type: "bar" },
                colors: ["#6366F1"],
                plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "65%" } },
                dataLabels: { enabled: true },
                xaxis: { categories: derived.context.map((c) => c.label), labels: { formatter: (v) => String(Math.round(Number(v))) } },
              }}
            />
          </ChartCard>
        )}

        {derived.ml && (
          <ChartCard
            title="ML and pattern agreement"
            icon={<FiCpu className="text-indigo-500" aria-hidden="true" />}
            note={derived.ml.rate != null ? `Agreement rate: ${fmtPct(derived.ml.rate)}` : "No finding had both an ML and a pattern signal to compare."}
          >
            {(() => {
              const parts = [
                { label: "Agreed", value: derived.ml.agreed, color: "#10B981" },
                { label: "Disagreed", value: derived.ml.disagreed, color: "#F97316" },
                { label: "No signal", value: derived.ml.noSignal, color: "#9CA3AF" },
              ].filter((p) => p.value > 0);
              return parts.length ? (
                <Chart
                  type="donut"
                  summary={`ML versus pattern agreement: ${describe(parts.map((p) => p.label), parts.map((p) => p.value))}`}
                  series={parts.map((p) => p.value)}
                  options={{
                    chart: { type: "donut" },
                    labels: parts.map((p) => p.label),
                    colors: parts.map((p) => p.color),
                    legend: { position: "bottom" },
                    plotOptions: { pie: { donut: { size: "55%" } } },
                  }}
                />
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">The ML check ran but compared nothing.</p>
              );
            })()}
          </ChartCard>
        )}
      </div>

      {derived.scatter.length > 0 && (
        <ChartCard
          title="Findings over time"
          icon={<FiClock className="text-indigo-500" aria-hidden="true" />}
          note="Position is in seconds for audio and video, or the sentence number for text."
        >
          <Chart
            type="scatter"
            height={300}
            summary={`${derived.scatter.length} findings plotted by position and confidence`}
            series={[{ name: "Findings", data: derived.scatter as unknown as number[][] }] as ApexAxisChartSeries}
            options={{
              chart: { type: "scatter", zoom: { enabled: false } },
              colors: ["#6366F1"],
              xaxis: { title: { text: "Position in conversation" }, tickAmount: 8, labels: { formatter: (v) => String(Math.round(Number(v))) } },
              yaxis: { min: 0, max: 1, title: { text: "Confidence" }, labels: { formatter: (v) => `${Math.round(v * 100)}%` } },
              markers: { size: 7 },
              tooltip: { x: { formatter: (v) => `Position ${v}` }, y: { formatter: (v) => fmtPct(v) } },
            }}
          />
        </ChartCard>
      )}

      {otherStats.length > 0 && (
        <Panel title="All statistics" icon={<FiDatabase className="text-gray-500" aria-hidden="true" />}>
          <div className="grid sm:grid-cols-2 gap-x-8">
            {otherStats.map(([key, value]) => (
              <DetailRow key={key} label={categoryLabel(key)}>
                {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(2)) : typeof value === "object" ? JSON.stringify(value) : String(value)}
              </DetailRow>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
