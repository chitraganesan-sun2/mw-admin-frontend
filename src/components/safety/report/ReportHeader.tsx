"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { SEVERITY_COLORS, formatRisk } from "../severity";
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

  if (!items.length) return <p className="text-sm text-gray-500">Not linked to a session, volunteer or learner.</p>;

  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex gap-1.5 min-w-0">
          <dt className="text-gray-500">{item.label}</dt>
          <dd className="font-medium text-gray-800 break-all">
            {item.href ? (
              <Link href={item.href} className="text-blue-700 hover:underline">
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
  const color = SEVERITY_COLORS[normalizeSeverity(report.severity) ?? scoreSeverity(score)].hex;

  return (
    <header className="bg-white rounded-xl border border-gray-100 p-5 mb-5 flex flex-col gap-4">
      <div>
        <Link href="/safety" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline">
          <FiArrowLeft aria-hidden="true" />
          Back to reports
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-gray-900">Analysis report #{report.id}</h1>
          <p className="text-sm text-gray-600 break-all mt-0.5" title={report.filename}>
            {report.filename}
          </p>
          <p className="text-xs text-gray-500 mt-1">Analysed {formatDisplayDateTime(report.created_at)}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-bold leading-none" style={{ color }} aria-label={`Risk score ${formatRisk(score)}`}>
              {score != null ? score.toFixed(0) : "-"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Risk score</div>
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <SeverityTag severity={report.severity} />
            <StatusTag status={report.status} />
          </div>
        </div>
      </div>

      <LinkedRecords report={report} />

      <ReportActions report={report} chatOpen={chatOpen} onToggleChat={onToggleChat} />
    </header>
  );
}
