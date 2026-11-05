"use client";

import Link from "next/link";
import { FiAlertOctagon, FiArrowLeft } from "react-icons/fi";
import { SEVERITY_COLORS, formatRisk, needsAttention } from "../severity";
import { SeverityTag, StatusTag } from "../SeverityTag";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { reportedUserHref } from "@/utils/reportLinks";
import ReportActions from "./ReportActions";
import { normalizeSeverity, scoreSeverity } from "./helpers";

function LinkedRecords({ report }: { report: SafetyReport }) {
  const volunteerHref = reportedUserHref({ reportedUserId: report.volunteer_id ?? undefined, reportedUserRole: "volunteer" });
  const learnerHref = reportedUserHref({ reportedUserId: report.learner_id ?? undefined, reportedUserRole: "learner" });
  const items = [
    report.session_id && { label: "Session", id: report.session_id, href: null },
    report.volunteer_id && { label: "Volunteer", id: report.volunteer_id, href: volunteerHref },
    report.learner_id && { label: "Learner", id: report.learner_id, href: learnerHref },
  ].filter(Boolean) as { label: string; id: string; href: string | null }[];

  if (!items.length) return <p className="m-0 text-sm text-[#6B7280]">Not linked to a session, volunteer or learner.</p>;

  return (
    <dl className="m-0 flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 gap-1.5">
          <dt className="text-[#6B7280]">{item.label}</dt>
          <dd className="m-0 break-all font-medium text-dark">
            {item.href ? (
              <Link href={item.href} className="text-[#046A8A] hover:underline">
                {item.id}
              </Link>
            ) : (
              item.id
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function ReportHeader({
  report,
  chatOpen,
  onToggleChat,
}: {
  report: SafetyReport;
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  const score = typeof report.risk_score === "number" ? report.risk_score : null;
  const severity = normalizeSeverity(report.severity) ?? scoreSeverity(score);
  // No score yet (still analysing, or failed): a neutral dash rather than a green "safe" one.
  const color = score == null ? "#9CA3AF" : SEVERITY_COLORS[severity].hex;
  const attention = String(report.status).toUpperCase() === "COMPLETED" && needsAttention(severity);

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-stroke bg-white p-4 sm:p-5">
      <div>
        <Link
          href="/safety"
          className="inline-flex min-h-[32px] items-center gap-1.5 text-sm font-medium text-[#046A8A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to reports
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="m-0 text-xl font-semibold text-dark sm:text-2xl">Analysis report #{report.id}</h2>
          <p className="m-0 mt-1 break-all text-sm text-[#4F4F4F]" title={report.filename}>
            {report.filename}
          </p>
          <p className="m-0 mt-1 text-xs text-[#6B7280]">Analyzed {formatDisplayDateTime(report.created_at)}</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
          <div className="text-center">
            <div className="text-3xl font-bold leading-none tabular-nums" style={{ color }} aria-label={`Risk score ${formatRisk(score)}`}>
              {score != null ? score.toFixed(0) : "-"}
            </div>
            <div className="mt-1 text-xs text-[#6B7280]">Risk score</div>
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <SeverityTag severity={report.severity} />
            <StatusTag status={report.status} />
          </div>
        </div>
      </div>

      {attention ? (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm"
          style={{ background: "#FFF7ED", borderColor: "#FED7AA", color: "#9A3412" }}
        >
          <FiAlertOctagon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p className="m-0">
            <strong className="font-semibold">{severity} risk.</strong> This conversation needs a safeguarding review. Check the
            findings and evidence below, and email the report to the safeguarding team if action is needed.
          </p>
        </div>
      ) : null}

      <LinkedRecords report={report} />

      <ReportActions report={report} chatOpen={chatOpen} onToggleChat={onToggleChat} />
    </header>
  );
}
