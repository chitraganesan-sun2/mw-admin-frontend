"use client";

import React, { ReactNode, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Spin, Tag } from "antd";
import { FiRefreshCw, FiZap } from "react-icons/fi";
import { getSafetyInsights } from "@/api/safety";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";

type Insights = Awaited<ReturnType<typeof getSafetyInsights>>;

// ── Safe rendering of the insights text ──────────────────────────────────────
// The pipeline returns light markdown ("## Heading", "- bullet", "1. step", **bold**, *italic*).
// It is rendered as React elements only - never as HTML - so nothing in the text can inject markup.

const BAR_GLYPHS = /[█░▒▓]+/g; // the text-mode bars; the charts show this already

const renderInline = (text: string): ReactNode[] =>
  text
    .replace(BAR_GLYPHS, "")
    .split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/)
    .filter((part) => part !== "")
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

const parseInsights = (text: string): Block[] => {
  const blocks: Block[] = [];
  text.split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const last = blocks[blocks.length - 1];

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1] });
      return;
    }
    const bullet = line.match(/^[-•]\s+(.*)$/);
    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
      return;
    }
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      if (last?.kind === "ol") last.items.push(numbered[1]);
      else blocks.push({ kind: "ol", items: [numbered[1]] });
      return;
    }
    blocks.push({ kind: "paragraph", text: line });
  });
  return blocks;
};

const InsightsBody = ({ text }: { text: string }) => {
  const blocks = parseInsights(text);
  return (
    <div className="text-sm leading-relaxed text-gray-medium">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return (
              <h4 key={i} className={`text-base font-semibold text-dark mb-2 ${i > 0 ? "mt-5" : "mt-0"}`}>
                {renderInline(block.text)}
              </h4>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pl-5 my-2 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-5 my-2 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={i} className="my-1">
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};

// ── Panel ────────────────────────────────────────────────────────────────────

/**
 * Written summary of the analytics. It is an explicit action because, when an LLM is configured on
 * the pipeline, generating it can take up to about two minutes.
 */
export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insights | null>(null);

  const mutation = useMutation({
    mutationFn: getSafetyInsights,
    onSuccess: (data) => setInsights(data),
    onError: (err) =>
      showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't generate insights. Please try again.") }),
  });

  const generate = () => mutation.mutate();
  const text = typeof insights?.insights === "string" ? insights.insights.trim() : "";
  const llmError = typeof insights?.llm_error === "string" ? insights.llm_error : "";

  return (
    <section aria-labelledby="safety-insights-heading" className="bg-white rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id="safety-insights-heading" className="text-base font-semibold m-0">
            Insights
          </h3>
          <p className="text-xs text-gray-medium m-0 mt-1">
            A written summary of the analytics, with anomalies and recommended actions.
          </p>
        </div>
        <Button
          type={insights ? "default" : "primary"}
          icon={insights ? <FiRefreshCw aria-hidden="true" /> : <FiZap aria-hidden="true" />}
          loading={mutation.isPending}
          onClick={generate}
        >
          {insights ? "Regenerate insights" : "Generate insights"}
        </Button>
      </div>

      <div aria-live="polite" className="mt-4">
        {mutation.isPending ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Spin />
            <p className="text-sm text-gray-medium m-0">
              Generating insights. This can take up to 2 minutes when an AI model is configured.
            </p>
          </div>
        ) : mutation.isError && !insights ? (
          <Alert
            type="error"
            showIcon
            message={getApiErrorMessage(mutation.error, "Couldn't generate insights. Please try again.")}
            action={
              <Button size="small" onClick={generate}>
                Try again
              </Button>
            }
          />
        ) : insights ? (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <Tag color={insights.llm_enhanced ? "purple" : "default"}>
                {insights.llm_enhanced ? "AI-enhanced" : "Rule-based"}
              </Tag>
              {insights.cached ? <Tag>From cache</Tag> : null}
            </div>
            {llmError ? (
              <Alert
                className="mb-3"
                type="info"
                showIcon
                message="The AI enhancement wasn't available, so this is the rule-based summary."
                description={llmError}
              />
            ) : null}
            {mutation.isError ? (
              <Alert
                className="mb-3"
                type="error"
                showIcon
                message={getApiErrorMessage(mutation.error, "Couldn't refresh the insights. Showing the previous ones.")}
              />
            ) : null}
            {text ? <InsightsBody text={text} /> : <p className="text-sm text-gray-medium m-0">No insights available.</p>}
          </>
        ) : (
          <p className="text-sm text-gray-medium text-center py-6 m-0">
            Select &quot;Generate insights&quot; for a written explanation of this data.
          </p>
        )}
      </div>
    </section>
  );
}
