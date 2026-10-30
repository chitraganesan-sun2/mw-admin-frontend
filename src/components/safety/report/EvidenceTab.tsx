"use client";

import { SEVERITY_COLORS, categoryLabel } from "../severity";
import { SeverityTag } from "../SeverityTag";
import FindingFilters from "./FindingFilters";
import { ShowMore, useFilteredList } from "./FindingsTab";
import { ReportFinding, confidenceSeverity, fmtPct, fmtSeconds } from "./helpers";
import { CategoryPills, ConfidenceBar, DetailRow, EmptyNote, Pill } from "./parts";

function EvidenceCard({ item }: { item: ReportFinding }) {
  const color = SEVERITY_COLORS[item.severity ?? confidenceSeverity(item.confidence)].hex;
  const hasBreakdown =
    item.contextType || item.baseConfidence != null || item.contextMultiplier != null || item.speaker || item.timestamp != null;

  return (
    <article className="bg-white rounded-xl border border-gray-100 border-l-4 p-4 flex flex-col gap-3" style={{ borderLeftColor: color }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <CategoryPills categories={item.categories.length ? item.categories : ["uncategorised"]} />
        <span className="flex flex-wrap items-center gap-1.5">
          <Pill tone="gray">{fmtPct(item.confidence)} confidence</Pill>
          <SeverityTag severity={item.severity} />
          {item.isJoke && <Pill tone="amber">Joke</Pill>}
          {item.isNegation && <Pill tone="amber">Negation</Pill>}
        </span>
      </div>

      <blockquote
        className="text-sm text-gray-800 bg-gray-50 rounded-md px-3 py-2 whitespace-pre-wrap break-words"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        {`“${item.text}”`}
      </blockquote>

      {item.matchedSentences.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-md p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Matched lines</h4>
          <ul className="flex flex-col gap-1.5">
            {item.matchedSentences.map((line, i) => (
              <li key={i} className="text-sm text-gray-700 bg-white rounded px-2.5 py-1.5 break-words" style={{ borderLeft: `2px solid ${color}` }}>
                {`“${line}”`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.matchedText && (
        <p className="text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-1.5">Pattern</span>
          <code className="bg-gray-100 px-2 py-0.5 rounded break-all">{item.matchedText}</code>
        </p>
      )}

      {hasBreakdown && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
          {item.contextType && <DetailRow label="Context">{categoryLabel(item.contextType.toLowerCase())}</DetailRow>}
          {item.speaker && <DetailRow label="Speaker">{item.speaker}</DetailRow>}
          {item.timestamp != null && <DetailRow label="Position">{fmtSeconds(item.timestamp)}</DetailRow>}
          {item.baseConfidence != null && <DetailRow label="Base pattern">{fmtPct(item.baseConfidence)}</DetailRow>}
          {item.contextMultiplier != null && <DetailRow label="Context multiplier">{`x${item.contextMultiplier.toFixed(2)}`}</DetailRow>}
          <DetailRow label="Joke">{item.isJoke ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Negation">{item.isNegation ? "Yes" : "No"}</DetailRow>
        </div>
      )}

      <ConfidenceBar value={item.confidence} label="Confidence" />
    </article>
  );
}

export default function EvidenceTab({ evidence }: { evidence: ReportFinding[] }) {
  const { filters, setFilters, categories, filtered, visible, showMore } = useFilteredList(evidence);

  if (!evidence.length) return <EmptyNote>No evidence was extracted for this report.</EmptyNote>;

  return (
    <div>
      <FindingFilters
        value={filters}
        onChange={setFilters}
        categories={categories}
        total={evidence.length}
        shown={filtered.length}
        noun="evidence items"
      />
      {filtered.length === 0 ? (
        <EmptyNote>No evidence items match these filters.</EmptyNote>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {filtered.slice(0, visible).map((item) => (
              <EvidenceCard key={item.key} item={item} />
            ))}
          </div>
          <ShowMore shown={Math.min(visible, filtered.length)} total={filtered.length} onMore={showMore} />
        </>
      )}
    </div>
  );
}
