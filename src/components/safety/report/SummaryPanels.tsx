"use client";

import { FiCpu, FiInfo } from "react-icons/fi";
import clsx from "clsx";
import { Panel, Pill } from "./parts";

// The pipeline writes "LLM Summary unavailable ..." into llm_summary when its language model could not
// be reached. That is shown as it is rather than hidden, so nobody mistakes the missing summary for a
// clean report.
const isUnavailable = (text: string) => /unavailable|not available/i.test(text);

export default function SummaryPanels({ llmSummary, summary }: { llmSummary: string | null; summary: string }) {
  const llm = llmSummary?.trim() ?? "";
  const llmDown = !llm || isUnavailable(llm);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <Panel
        title="AI summary"
        icon={<FiCpu className="text-indigo-500" aria-hidden="true" />}
        extra={llmDown ? <Pill tone="amber">Unavailable</Pill> : <Pill tone="purple">Language model</Pill>}
      >
        <p
          className={clsx(
            "text-sm whitespace-pre-wrap break-words leading-relaxed",
            llmDown ? "text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2" : "text-gray-800"
          )}
        >
          {llm || "The pipeline did not produce an AI summary for this report."}
        </p>
      </Panel>

      <Panel title="Rule-based summary" icon={<FiInfo className="text-blue-500" aria-hidden="true" />} extra={<Pill tone="blue">Pipeline</Pill>}>
        {summary.trim() ? (
          <pre className="text-xs sm:text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words overflow-x-auto font-mono bg-gray-50 rounded-md p-3 max-h-[420px] overflow-y-auto">
            {summary}
          </pre>
        ) : (
          <p className="text-sm text-gray-500">The pipeline did not produce a summary for this report.</p>
        )}
      </Panel>
    </div>
  );
}
