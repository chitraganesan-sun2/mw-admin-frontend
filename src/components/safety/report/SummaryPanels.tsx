"use client";

import { Fragment, type ReactNode } from "react";
import { FiCpu, FiInfo } from "react-icons/fi";
import clsx from "clsx";
import { Panel, Pill } from "./parts";

// The pipeline writes "LLM Summary unavailable ..." into llm_summary when its language model could not
// be reached. That is shown as it is rather than hidden, so nobody mistakes the missing summary for a
// clean report.
const isUnavailable = (text: string) => /unavailable|not available/i.test(text);

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

// ── Rule-based summary: the pipeline writes it as a fixed-width text report ("SECTION 2 — EXECUTIVE SUMMARY",
// rows of underscores, "Label : value" lines). It is shown as titled sections with the labels set apart from
// the values. Anything that does not look like that report is shown as plain preformatted text instead.

const SECTION = /^\s*SECTION\s+\d+\s*[—–-]+\s*(.+?)\s*$/i;
const RULE_ONLY = /^[\s_\-=━─═~]{6,}$/;
const BULLET = /^\s*[•\-*]\s+(.*)$/;
const KEY_VALUE = /^\s*([A-Za-z][A-Za-z0-9 /()%&'-]{1,34}?)\s*:\s+(\S.*)$/;
const SEVERITY_LINE = /^\s*\[(CRITICAL|HIGH|MEDIUM|MODERATE|LOW)\]\s*(.*)$/i;

const titleCase = (text: string) => text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

type Section = { title: string; lines: string[] };

export const parseSummary = (text: string): { header: string[]; sections: Section[] } => {
  const header: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (RULE_ONLY.test(line)) continue;
    const match = line.match(SECTION);
    if (match) {
      current = { title: titleCase(match[1]), lines: [] };
      sections.push(current);
      continue;
    }
    (current ? current.lines : header).push(line);
  }
  return { header: header.filter((l) => l.trim()), sections };
};

const SectionBody = ({ lines }: { lines: string[] }) => {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let pairs: [string, string][] = [];
  let bullets: string[] = [];

  const flush = () => {
    const key = blocks.length;
    if (paragraph.length) {
      blocks.push(
        <p key={`p${key}`} className="m-0 text-sm leading-relaxed text-dark">
          {squash(paragraph.join(" "))}
        </p>
      );
    }
    if (pairs.length) {
      blocks.push(
        <dl key={`d${key}`} className="m-0 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
          {pairs.map(([label, value], i) => (
            <Fragment key={i}>
              <dt className="text-[#4F4F4F]">{label}</dt>
              <dd className="m-0 break-words font-medium text-dark">{value}</dd>
            </Fragment>
          ))}
        </dl>
      );
    }
    if (bullets.length) {
      blocks.push(
        <ul key={`u${key}`} className="m-0 list-disc space-y-1 pl-5 text-sm text-dark">
          {bullets.map((b, i) => (
            <li key={i} className="break-words">
              {b}
            </li>
          ))}
        </ul>
      );
    }
    paragraph = [];
    pairs = [];
    bullets = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const sev = line.match(SEVERITY_LINE);
    const bullet = line.match(BULLET);
    const pair = line.match(KEY_VALUE);
    if (sev) {
      flush();
      blocks.push(
        <p key={`s${blocks.length}`} className="m-0 pt-1 text-sm font-semibold text-dark">
          {titleCase(sev[1])} · {squash(sev[2])}
        </p>
      );
    } else if (bullet) {
      if (paragraph.length || pairs.length) flush();
      bullets.push(squash(bullet[1]).replace(/\s{2,}/g, " · "));
    } else if (pair && !paragraph.length) {
      if (bullets.length) flush();
      pairs.push([squash(pair[1]), squash(pair[2])]);
    } else {
      if (pairs.length || bullets.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return <div className="flex flex-col gap-2.5">{blocks}</div>;
};

function FormattedSummary({ text }: { text: string }) {
  const { header, sections } = parseSummary(text);
  if (!sections.length) {
    return (
      <pre className="m-0 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 font-mono text-xs leading-relaxed text-dark sm:text-[13px]">
        {text}
      </pre>
    );
  }
  return (
    <div className="flex max-h-[560px] flex-col gap-5 overflow-y-auto pr-1">
      {header.length ? <p className="m-0 text-xs text-[#4F4F4F]">{header.map(squash).join(" · ")}</p> : null}
      {sections.map((section) => (
        <section key={section.title}>
          <h4 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F4F4F]">{section.title}</h4>
          <SectionBody lines={section.lines} />
        </section>
      ))}
    </div>
  );
}

export default function SummaryPanels({ llmSummary, summary }: { llmSummary: string | null; summary: string }) {
  const llm = llmSummary?.trim() ?? "";
  const rules = summary.trim();
  const llmDown = !llm || isUnavailable(llm);
  // With the language model switched off the pipeline stores the rule-based summary in the AI field as well.
  // Showing that twice, once labelled "Language model", is misleading, so it is shown once and described as it is.
  const aiIsJustTheRules = !llmDown && rules !== "" && squash(llm) === squash(rules);

  const rulesPanel = (
    <Panel
      title={aiIsJustTheRules ? "Summary" : "Rule-based summary"}
      icon={<FiInfo className="text-[#0369A1]" aria-hidden="true" />}
      extra={<Pill tone="blue">{aiIsJustTheRules ? "Rule-based" : "Pipeline"}</Pill>}
    >
      {aiIsJustTheRules ? (
        <p className="m-0 mb-3 rounded-xl bg-[#F0F9FF] px-3 py-2 text-xs text-[#0369A1]">
          The AI-written summary is switched off, so this is the rule-based summary of the findings.
        </p>
      ) : null}
      {rules ? (
        <FormattedSummary text={summary} />
      ) : (
        <p className="m-0 text-sm text-[#4F4F4F]">The pipeline did not produce a summary for this report.</p>
      )}
    </Panel>
  );

  if (aiIsJustTheRules) return <div className="min-w-0">{rulesPanel}</div>;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Panel
        title="AI summary"
        icon={<FiCpu className="text-indigo-500" aria-hidden="true" />}
        extra={llmDown ? <Pill tone="amber">Unavailable</Pill> : <Pill tone="purple">Language model</Pill>}
      >
        <p
          className={clsx(
            "m-0 whitespace-pre-wrap break-words text-sm leading-relaxed",
            llmDown ? "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900" : "text-dark"
          )}
        >
          {llm || "The pipeline did not produce an AI summary for this report."}
        </p>
      </Panel>
      {rulesPanel}
    </div>
  );
}
