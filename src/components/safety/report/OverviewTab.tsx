"use client";

import { FiBarChart2 } from "react-icons/fi";
import { SEVERITY_COLORS, categoryLabel } from "../severity";
import { SeverityTag } from "../SeverityTag";
import { Chart, ChartCard } from "./Chart";
import { ReportModel, normalizeSeverity, scoreSeverity } from "./helpers";
import ScoreBreakdown from "./ScoreBreakdown";
import SummaryPanels from "./SummaryPanels";
import { Panel } from "./parts";

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RiskRing({ report, model }: { report: SafetyReport; model: ReportModel }) {
  const score = typeof report.risk_score === "number" ? report.risk_score : null;
  const color = SEVERITY_COLORS[normalizeSeverity(report.severity) ?? scoreSeverity(score)].hex;
  const offset = CIRCUMFERENCE - (Math.min(Math.max(score ?? 0, 0), 100) / 100) * CIRCUMFERENCE;

  return (
    <Panel title="Overall risk score">
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative w-[210px] h-[210px]"
          role="img"
          aria-label={`Risk score ${score != null ? score.toFixed(0) : "not available"} out of 100, ${report.severity ?? "no severity"}`}
        >
          <svg width="210" height="210" className="-rotate-90" aria-hidden="true">
            <circle cx="105" cy="105" r={RADIUS} fill="none" stroke="#E5E7EB" strokeWidth="14" />
            {score != null && (
              <circle
                cx="105"
                cy="105"
                r={RADIUS}
                fill="none"
                stroke={color}
                strokeWidth="14"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-5xl font-bold leading-none" style={{ color }}>
              {score != null ? score.toFixed(0) : "-"}
            </span>
            <span className="text-xs text-gray-500">out of 100</span>
            <SeverityTag severity={report.severity} />
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 w-full text-center">
          {[
            ["Findings", model.findings.length],
            ["Evidence", model.evidence.length],
            ["Categories", model.categoryCounts.length],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-lg font-semibold text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}

export default function OverviewTab({ report, model }: { report: SafetyReport; model: ReportModel }) {
  const top = model.categoryCounts;
  const barColors = top.map((_, i) => (i === 0 ? "#EF4444" : i === 1 ? "#F97316" : i < 4 ? "#F59E0B" : "#3B82F6"));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-4 items-start">
        <RiskRing report={report} model={model} />
        <SummaryPanels llmSummary={report.llm_summary} summary={report.summary ?? ""} />
      </div>

      <ScoreBreakdown findings={model.findings} riskScore={report.risk_score} />

      {top.length > 0 && (
        <ChartCard title="Findings by risk category" icon={<FiBarChart2 className="text-indigo-500" aria-hidden="true" />}>
          <Chart
            type="bar"
            height={Math.max(220, top.length * 34 + 60)}
            summary={`Findings per category: ${top.map((c) => `${categoryLabel(c.category)} ${c.count}`).join(", ")}`}
            series={[{ name: "Findings", data: top.map((c) => c.count) }]}
            options={{
              chart: { type: "bar" },
              plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4, barHeight: "70%" } },
              colors: barColors,
              legend: { show: false },
              dataLabels: { enabled: true },
              xaxis: {
                categories: top.map((c) => categoryLabel(c.category)),
                labels: { formatter: (v) => String(Math.round(Number(v))) },
              },
              tooltip: { y: { formatter: (v) => `${v} ${v === 1 ? "finding" : "findings"}` } },
            }}
          />
        </ChartCard>
      )}
    </div>
  );
}
