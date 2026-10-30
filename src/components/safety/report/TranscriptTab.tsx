"use client";

import { Fragment, useMemo } from "react";
import { SEVERITY_COLORS, SEVERITY_ORDER, categoryLabel, severityRank } from "../severity";
import { ReportFinding, confidenceSeverity } from "./helpers";
import { EmptyNote, Panel } from "./parts";

interface Range {
  start: number;
  end: number;
  rank: number;
  isMatch: boolean;
  categories: string[];
}

interface Segment {
  text: string;
  rank: number; // -1 = not flagged
  isMatch: boolean;
  categories: string[];
}

const MIN_NEEDLE = 3;

const occurrences = (haystack: string, needle: string, from = 0, to = haystack.length): number[] => {
  const hits: number[] = [];
  if (needle.length < MIN_NEEDLE) return hits;
  let at = haystack.indexOf(needle, from);
  while (at !== -1 && at + needle.length <= to) {
    hits.push(at);
    at = haystack.indexOf(needle, at + needle.length);
  }
  return hits;
};

/** Where each flagged passage sits in the transcript. Matching is a plain case-insensitive search. */
export function buildRanges(transcript: string, items: ReportFinding[]): Range[] {
  const lower = transcript.toLowerCase();
  // Lower-casing can change the length of some characters; offsets would then be wrong.
  if (lower.length !== transcript.length) return [];

  const ranges: Range[] = [];
  items.forEach((item) => {
    const severity = item.severity ?? confidenceSeverity(item.confidence);
    const rank = severityRank(severity);
    const categories = item.categories.map((c) => c.toLowerCase());
    const sentences = [item.text, ...item.matchedSentences].map((s) => s.trim().toLowerCase());
    sentences.forEach((sentence) => {
      occurrences(lower, sentence).forEach((start) => {
        const end = start + sentence.length;
        ranges.push({ start, end, rank, isMatch: false, categories });
        const needle = item.matchedText?.trim().toLowerCase();
        if (needle) {
          const inside = occurrences(lower, needle, start, end)[0];
          if (inside !== undefined) ranges.push({ start: inside, end: inside + needle.length, rank, isMatch: true, categories });
        }
      });
    });
  });
  return ranges;
}

export function buildSegments(transcript: string, ranges: Range[]): Segment[] {
  const points = Array.from(new Set([0, transcript.length, ...ranges.flatMap((r) => [r.start, r.end])])).sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    if (a === b) continue;
    const covering = ranges.filter((r) => r.start <= a && r.end >= b);
    segments.push({
      text: transcript.slice(a, b),
      rank: covering.length ? Math.max(...covering.map((r) => r.rank)) : -1,
      isMatch: covering.some((r) => r.isMatch),
      categories: Array.from(new Set(covering.flatMap((r) => r.categories))),
    });
  }
  return segments;
}

export default function TranscriptTab({
  transcript,
  items,
}: {
  transcript: string;
  items: ReportFinding[];
}) {
  const { segments, flaggedPassages, offsetsUsable } = useMemo(() => {
    const ranges = buildRanges(transcript, items);
    const segs = buildSegments(transcript, ranges);
    return {
      segments: segs,
      flaggedPassages: mergedCount(ranges.filter((r) => !r.isMatch)),
      offsetsUsable: transcript.toLowerCase().length === transcript.length,
    };
  }, [transcript, items]);

  if (!transcript.trim()) return <EmptyNote>This report has no transcript.</EmptyNote>;

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
          <span>
            {flaggedPassages > 0
              ? `${flaggedPassages} flagged ${flaggedPassages === 1 ? "passage" : "passages"} highlighted. Underlined words are the matched pattern.`
              : "No flagged passages could be located in the transcript text."}
          </span>
          <ul className="flex flex-wrap items-center gap-3" aria-label="Highlight colours">
            {SEVERITY_ORDER.filter((s) => s !== "Safe").map((s) => (
              <li key={s} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: `${SEVERITY_COLORS[s].hex}55`, border: `1px solid ${SEVERITY_COLORS[s].hex}` }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
        {!offsetsUsable && (
          <p className="text-xs text-gray-500 mt-2">Highlighting is unavailable for this transcript; showing it unmarked.</p>
        )}
      </Panel>

      <Panel title="Transcript">
        <div className="text-sm leading-7 text-gray-800 whitespace-pre-wrap break-words">
          {segments.map((seg, i) =>
            seg.rank < 0 ? (
              <Fragment key={i}>{seg.text}</Fragment>
            ) : (
              <mark
                key={i}
                title={seg.categories.map((c) => categoryLabel(c)).join(", ")}
                className="rounded-sm px-0.5 text-inherit"
                style={{
                  background: `${SEVERITY_COLORS[SEVERITY_ORDER[seg.rank]].hex}2E`,
                  borderBottom: `2px solid ${SEVERITY_COLORS[SEVERITY_ORDER[seg.rank]].hex}`,
                  fontWeight: seg.isMatch ? 700 : undefined,
                  textDecoration: seg.isMatch ? "underline" : undefined,
                }}
              >
                {seg.text}
              </mark>
            )
          )}
        </div>
      </Panel>
    </div>
  );
}

/** Number of separate passages once overlapping/adjacent ranges are merged. */
function mergedCount(ranges: Range[]): number {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let count = 0;
  let end = -1;
  sorted.forEach((r) => {
    if (r.start > end) count += 1;
    end = Math.max(end, r.end);
  });
  return count;
}
