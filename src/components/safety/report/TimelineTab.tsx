"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Switch } from "antd";
import { FiAlertTriangle, FiClock } from "react-icons/fi";
import clsx from "clsx";
import { ReportFinding, fmtSeconds, textContains } from "./helpers";
import { EmptyNote, Panel, Pill } from "./parts";
import { ShowMore } from "./FindingsTab";

const PAGE = 25;
const KEY_LENGTH = 30; // a segment is flagged when it contains the first 30 characters of a flagged quote

interface Props {
  timeline: SafetyTimelineSegment[];
  transcript: string;
  flagged: ReportFinding[];
}

export default function TimelineTab({ timeline, transcript, flagged }: Props) {
  const uid = useId();
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const keys = useMemo(
    () =>
      Array.from(
        new Set(
          flagged
            .flatMap((f) => [f.text, ...f.matchedSentences])
            .map((t) => t.trim().slice(0, KEY_LENGTH))
            .filter(Boolean)
        )
      ),
    [flagged]
  );

  const segments = useMemo(
    () =>
      timeline.map((seg, i) => ({
        seg,
        index: i,
        isFlagged: keys.some((k) => textContains(String(seg.text ?? ""), k)),
      })),
    [timeline, keys]
  );
  const shown = flaggedOnly ? segments.filter((s) => s.isFlagged) : segments;
  useEffect(() => setVisible(PAGE), [flaggedOnly]);

  // Text transcripts have no timing: one segment starting and ending at 0.
  const hasTiming = timeline.some((s) => (s.start ?? 0) > 0 || (s.end ?? 0) > 0);

  if (!timeline.length) {
    return (
      <Panel title="Timeline">
        <p className="text-sm text-gray-600 mb-3">No timeline segments are available for this report. The full transcript is shown instead.</p>
        <div className="text-sm whitespace-pre-wrap break-words bg-gray-50 rounded-md p-3 text-gray-800">
          {transcript || "No transcript available."}
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <p className="flex-1 min-w-[240px]">
            Segments that contain flagged text are marked.{" "}
            {hasTiming ? "Times follow the transcription timing." : "This analysis has no timing information, so segments are not timed."}
          </p>
          <label htmlFor={`${uid}-only`} className="flex items-center gap-2 cursor-pointer">
            <Switch id={`${uid}-only`} checked={flaggedOnly} onChange={setFlaggedOnly} />
            Flagged segments only
          </label>
        </div>
      </Panel>

      {shown.length === 0 ? (
        <EmptyNote>No flagged segments in this timeline.</EmptyNote>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {shown.slice(0, visible).map(({ seg, index, isFlagged }) => (
              <li
                key={index}
                className={clsx(
                  "bg-white rounded-xl border p-4 border-l-4",
                  isFlagged ? "border-red-200 border-l-red-500 bg-red-50/40" : "border-gray-100 border-l-gray-200"
                )}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1.5">
                  <FiClock aria-hidden="true" />
                  {hasTiming ? (
                    <span>
                      {typeof seg.start === "number" ? fmtSeconds(seg.start) : String(seg.start)} to{" "}
                      {typeof seg.end === "number" ? fmtSeconds(seg.end) : String(seg.end)}
                    </span>
                  ) : (
                    <span>Segment {index + 1}</span>
                  )}
                  {isFlagged && (
                    <Pill tone="red">
                      <span className="inline-flex items-center gap-1">
                        <FiAlertTriangle aria-hidden="true" /> Flagged
                      </span>
                    </Pill>
                  )}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{String(seg.text ?? "")}</p>
              </li>
            ))}
          </ol>
          <ShowMore shown={Math.min(visible, shown.length)} total={shown.length} onMore={() => setVisible((n) => n + PAGE)} />
        </>
      )}
    </div>
  );
}
