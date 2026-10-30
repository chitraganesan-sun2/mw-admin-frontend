"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { SEVERITY_COLORS, categoryLabel } from "../severity";
import { SeverityTag } from "../SeverityTag";
import FindingFilters from "./FindingFilters";
import {
  DEFAULT_FILTERS,
  FindingFilters as Filters,
  ReportFinding,
  confidenceSeverity,
  filterFindings,
  fmtPct,
  fmtSeconds,
  isNeutralContext,
  uniqueCategories,
} from "./helpers";
import { CategoryPills, ConfidenceBar, DetailRow, EmptyNote, Pill } from "./parts";

const PAGE = 25;

/** Shared by the Findings and Evidence tabs: filter bar + paged list. */
export function useFilteredList(items: ReportFinding[]) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [visible, setVisible] = useState(PAGE);
  const categories = useMemo(() => uniqueCategories(items), [items]);
  const filtered = useMemo(() => filterFindings(items, filters), [items, filters]);
  useEffect(() => setVisible(PAGE), [filters]);
  return { filters, setFilters, categories, filtered, visible, showMore: () => setVisible((n) => n + PAGE) };
}

export function ShowMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <div className="text-center mt-4">
      <Button onClick={onMore}>
        Show {Math.min(PAGE, total - shown)} more ({total - shown} remaining)
      </Button>
    </div>
  );
}

function FlagPills({ finding }: { finding: ReportFinding }) {
  return (
    <>
      {!isNeutralContext(finding.contextType) && <Pill tone="purple">{categoryLabel(finding.contextType ?? "")}</Pill>}
      {finding.isJoke && <Pill tone="amber">Joke</Pill>}
      {finding.isNegation && <Pill tone="amber">Negation</Pill>}
    </>
  );
}

function Quote({ children, color }: { children: string; color?: string }) {
  return (
    <blockquote
      className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2 border-l-4 whitespace-pre-wrap break-words"
      style={{ borderLeftColor: color ?? "#d1d5db" }}
    >
      {`“${children}”`}
    </blockquote>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{children}</h4>;
}

function FindingCard({ finding, index }: { finding: ReportFinding; index: number }) {
  const [open, setOpen] = useState(false);
  const color = SEVERITY_COLORS[confidenceSeverity(finding.confidence)].hex;
  const bodyId = `finding-body-${finding.key}`;
  const preview = finding.text.length > 110 ? `${finding.text.slice(0, 110)}...` : finding.text;
  const ml = finding.ml;

  return (
    <article className="bg-white rounded-xl border border-gray-100 border-l-4 overflow-hidden" style={{ borderLeftColor: color }}>
      <button
        type="button"
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xs font-semibold text-gray-400 pt-1 shrink-0">#{index + 1}</span>
        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
          <CategoryPills categories={finding.categories.length ? finding.categories : ["uncategorised"]} />
          <span className="text-sm text-gray-700 break-words">{`“${preview}”`}</span>
          <span className="flex flex-wrap gap-1.5 items-center">
            <Pill tone="gray">{fmtPct(finding.confidence)} confidence</Pill>
            <SeverityTag severity={finding.severity} />
            <FlagPills finding={finding} />
          </span>
        </span>
        <span className="pt-1 text-gray-500 shrink-0" aria-hidden="true">
          {open ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </span>
        <span className="sr-only">{open ? "Collapse details" : "Expand details"}</span>
      </button>

      {open && (
        <div id={bodyId} className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-100 pt-4">
          <div>
            <SectionTitle>Full text</SectionTitle>
            <Quote color={color}>{finding.text}</Quote>
          </div>

          <div>
            <SectionTitle>Confidence breakdown</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-x-6">
              <DetailRow label="Base pattern confidence">{finding.baseConfidence != null ? fmtPct(finding.baseConfidence) : "-"}</DetailRow>
              <DetailRow label="Context multiplier">
                {finding.contextMultiplier != null ? `x${finding.contextMultiplier.toFixed(2)}` : "-"}
              </DetailRow>
              <DetailRow label="Joke penalty">{finding.isJoke ? `-${fmtPct(finding.jokePenalty)}` : "None"}</DetailRow>
              <DetailRow label="Negation penalty">{finding.isNegation ? `-${fmtPct(finding.negationPenalty)}` : "None"}</DetailRow>
              {finding.mlFusedConfidence != null && (
                <DetailRow label="ML fused confidence">{fmtPct(finding.mlFusedConfidence)}</DetailRow>
              )}
              <DetailRow label="Final confidence">{fmtPct(finding.confidence)}</DetailRow>
            </div>
            <div className="mt-2">
              <ConfidenceBar value={finding.confidence} label="Final confidence" />
            </div>
          </div>

          {finding.matchedText && (
            <div>
              <SectionTitle>Matched pattern text</SectionTitle>
              <code className="text-sm bg-gray-100 px-2 py-0.5 rounded break-all">{finding.matchedText}</code>
            </div>
          )}

          {finding.matchedSentences.length > 0 && (
            <div>
              <SectionTitle>Triggering lines</SectionTitle>
              <div className="flex flex-col gap-1.5">
                {finding.matchedSentences.map((line, i) => (
                  <Quote key={i} color={color}>
                    {line}
                  </Quote>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Context</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-x-6">
              <DetailRow label="Context type">{finding.contextType ? categoryLabel(finding.contextType.toLowerCase()) : "-"}</DetailRow>
              <DetailRow label="Speaker">{finding.speaker ?? "-"}</DetailRow>
              <DetailRow label="Severity">{finding.severity ?? "-"}</DetailRow>
              {finding.patternCount != null && <DetailRow label="Pattern matches">{finding.patternCount}</DetailRow>}
              {finding.timestamp != null && <DetailRow label="Position">{fmtSeconds(finding.timestamp)}</DetailRow>}
            </div>
          </div>

          {ml && (
            <div>
              <SectionTitle>Machine-learning check</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-x-6">
                <DetailRow label="Top label">{ml.topLabel ? categoryLabel(ml.topLabel) : "-"}</DetailRow>
                <DetailRow label="Top confidence">{ml.topConfidence != null ? fmtPct(ml.topConfidence) : "-"}</DetailRow>
                {ml.riskScore != null && <DetailRow label="ML risk score">{fmtPct(ml.riskScore)}</DetailRow>}
                <DetailRow label="Agreement with pattern match">
                  {ml.agreement == null ? "No signal" : ml.agreement ? "Agrees" : "Disagrees"}
                </DetailRow>
              </div>
              {ml.disagreement && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                  The ML check contradicts the pattern match for this finding.
                </p>
              )}
              {Object.keys(ml.allScores).length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {Object.entries(ml.allScores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([label, score]) => (
                      <li key={label} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-2 text-xs">
                        <span className="text-gray-600 truncate" title={categoryLabel(label)}>
                          {categoryLabel(label)}
                        </span>
                        <span className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${Math.min(score, 1) * 100}%`, background: label === "safe" ? "#10B981" : "#6366F1" }}
                          />
                        </span>
                        <span className="text-right text-gray-700">{fmtPct(score)}</span>
                      </li>
                    ))}
                </ul>
              )}
              {ml.matchedLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ml.matchedLabels.map((l) => (
                    <Pill key={l} tone="blue">
                      {categoryLabel(l)}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function FindingsTab({ findings }: { findings: ReportFinding[] }) {
  const { filters, setFilters, categories, filtered, visible, showMore } = useFilteredList(findings);

  if (!findings.length) return <EmptyNote>The analysis did not produce any findings for this report.</EmptyNote>;

  return (
    <div>
      <FindingFilters
        value={filters}
        onChange={setFilters}
        categories={categories}
        total={findings.length}
        shown={filtered.length}
        noun="findings"
      />
      <p className="text-sm text-gray-500 mb-3">Select a finding to see its full confidence and ML breakdown.</p>
      {filtered.length === 0 ? (
        <EmptyNote>No findings match these filters.</EmptyNote>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {filtered.slice(0, visible).map((finding) => (
              <FindingCard key={finding.key} finding={finding} index={Number(finding.key)} />
            ))}
          </div>
          <ShowMore shown={Math.min(visible, filtered.length)} total={filtered.length} onMore={showMore} />
        </>
      )}
    </div>
  );
}
