"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Button } from "antd";
import clsx from "clsx";
import { FiCpu, FiRotateCcw, FiSend, FiUser } from "react-icons/fi";
import { askSafetyReport } from "@/api/safety";
import { getApiErrorMessage } from "@/utils/apiError";
import { fmtPct } from "./report/helpers";

const MAX_QUESTION_LENGTH = 2000;

const SUGGESTED = [
  "What are the main risk factors?",
  "Were any meeting requests detected?",
  "Is there evidence of secrecy patterns?",
  "Summarise the explicit content found.",
  "Which sentences had the highest confidence?",
];

const GREETING = "Hello, I'm Aura. Ask me about this analysis: the findings, the evidence, the risk score or specific patterns that were detected.";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  sources?: string[];
  confidence?: number | null;
}

/** Sources arrive as plain excerpts, but tolerate objects with a text field rather than showing "[object Object]". */
const sourceText = (source: unknown): string => {
  if (typeof source === "string") return source;
  if (source && typeof source === "object") {
    const s = source as Record<string, unknown>;
    const text = s.text ?? s.excerpt ?? s.content ?? s.evidence;
    if (typeof text === "string") return text;
    return JSON.stringify(source);
  }
  return String(source ?? "");
};

/** The assistant marks emphasis with **double asterisks**; render that, everything else as plain text. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

function confidenceLabel(confidence: number | null | undefined): string | null {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) return null;
  return confidence <= 1 ? fmtPct(confidence, 0) : `${confidence.toFixed(0)}%`;
}

export default function Chatbot({ reportId }: { reportId: number }) {
  const uid = useId();
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || isLoading) return;
    if (question.length > MAX_QUESTION_LENGTH) return;

    setInput("");
    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", content: question }]);
    setIsLoading(true);
    try {
      const res = await askSafetyReport(reportId, question);
      const sources = Array.isArray(res.sources) ? res.sources.map(sourceText).filter((s) => s.trim()) : [];
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "assistant",
          content: res.answer?.trim() ? res.answer : "The assistant returned an empty answer.",
          sources,
          confidence: res.confidence,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "assistant",
          isError: true,
          content: getApiErrorMessage(err, "Couldn't get an answer. Check that the report has finished processing and try again."),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const tooLong = input.length > MAX_QUESTION_LENGTH;
  const canSend = !!input.trim() && !tooLong && !isLoading;

  return (
    <section aria-label="Chat about this report" className="bg-white rounded-xl border border-gray-100 flex flex-col h-[600px] max-h-[80vh] min-w-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <span className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0" aria-hidden="true">
          <FiCpu size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800">Aura, safety assistant</h3>
          <p className="text-xs text-gray-500">Answers from this report&apos;s transcript and findings</p>
        </div>
        <Button
          type="text"
          size="small"
          aria-label="Clear conversation"
          title="Clear conversation"
          icon={<FiRotateCcw aria-hidden="true" />}
          disabled={!messages.length || isLoading}
          onClick={() => setMessages([])}
        />
      </div>

      <div ref={listRef} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation" className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        <div className="flex gap-2 items-end max-w-[92%]">
          <span className="w-6 h-6 rounded-full bg-gray-100 text-indigo-500 flex items-center justify-center shrink-0" aria-hidden="true">
            <FiCpu size={13} />
          </span>
          <div className="text-sm bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-gray-800">{GREETING}</div>
        </div>

        {messages.map((m) => {
          const mine = m.role === "user";
          const conf = confidenceLabel(m.confidence);
          return (
            <div key={m.id} className={clsx("flex gap-2 items-end max-w-[92%]", mine && "self-end flex-row-reverse")}>
              <span
                className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0", mine ? "bg-indigo-500 text-white" : "bg-gray-100 text-indigo-500")}
                aria-hidden="true"
              >
                {mine ? <FiUser size={13} /> : <FiCpu size={13} />}
              </span>
              <div
                className={clsx(
                  "text-sm px-3 py-2 min-w-0 whitespace-pre-wrap break-words leading-relaxed",
                  mine && "bg-indigo-500 text-white rounded-2xl rounded-br-sm",
                  !mine && !m.isError && "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm",
                  m.isError && "bg-red-50 text-red-800 border border-red-200 rounded-2xl rounded-bl-sm"
                )}
                role={m.isError ? "alert" : undefined}
              >
                <span className="sr-only">{mine ? "You: " : m.isError ? "Error: " : "Aura: "}</span>
                {mine || m.isError ? m.content : <RichText text={m.content} />}
                {!mine && !m.isError && (conf || (m.sources && m.sources.length > 0)) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 whitespace-normal">
                    {conf && <p>Confidence: {conf}</p>}
                    {m.sources && m.sources.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer select-none">
                          Sources ({m.sources.length})
                        </summary>
                        <ol className="list-decimal pl-4 mt-1.5 flex flex-col gap-1.5">
                          {m.sources.map((s, i) => (
                            <li key={i} className="whitespace-pre-wrap break-words">
                              {s}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2 items-end" role="status">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-indigo-500 flex items-center justify-center shrink-0" aria-hidden="true">
              <FiCpu size={13} />
            </span>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm text-gray-500 flex items-center gap-1.5">
              <span className="sr-only">Aura is working on an answer</span>
              {[0, 150, 300].map((delay) => (
                <span key={delay} aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {messages.length === 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Suggested questions</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="px-4 py-3 border-t border-gray-100 flex flex-col gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor={`${uid}-q`} className="text-xs font-medium text-gray-600">
          Your question
        </label>
        <div className="flex gap-2 items-end">
          <textarea
            id={`${uid}-q`}
            ref={inputRef}
            rows={2}
            value={input}
            aria-invalid={tooLong}
            aria-describedby={`${uid}-count`}
            placeholder="Ask about findings, risk or patterns"
            className="flex-1 min-w-0 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button type="primary" htmlType="submit" disabled={!canSend} aria-label="Send question" icon={<FiSend aria-hidden="true" />} />
        </div>
        <p id={`${uid}-count`} className={clsx("text-xs text-right", tooLong ? "text-red-600" : "text-gray-400")}>
          {input.length} / {MAX_QUESTION_LENGTH}
          {tooLong && " - too long, please shorten your question"}
        </p>
      </form>
    </section>
  );
}
