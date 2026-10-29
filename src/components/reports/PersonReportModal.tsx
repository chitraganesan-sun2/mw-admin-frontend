"use client";

import Link from "next/link";
import { useState } from "react";
import { IoMdCheckmark } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { rejectReport, resolveReport } from "@/api/reports";
import Button from "@/components/common/Button";
import CenterModal from "@/components/common/Modals/CenterModal";
import { showToast } from "@/components/common/Toast";
import { formatDisplayDate } from "@/utils/moment";
import type { Report } from "@/constants/column";
import { reportedUserHref } from "@/utils/reportLinks";

const TYPE_LABELS: Record<string, string> = {
  user: "Person",
  message: "Chat message",
  session: "Session",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <div className="text-base text-gray-900 break-words whitespace-pre-wrap">{children}</div>
  </div>
);

const PersonReportModal = ({
  isOpen,
  onClose,
  report,
  onChanged,
}: {
  isOpen: boolean;
  onClose: () => void;
  report?: Report;
  onChanged: () => void;
}) => {
  const [busy, setBusy] = useState<"resolved" | "rejected" | null>(null);
  const href = reportedUserHref(report);

  const update = async (next: "resolved" | "rejected") => {
    if (!report || busy) return;
    setBusy(next);
    try {
      const status = await (next === "resolved" ? resolveReport(report.reportId) : rejectReport(report.reportId));
      if (status !== 200) throw new Error(`Unexpected status ${status}`);
      showToast({ type: "success", message: next === "resolved" ? "Report marked as resolved" : "Report rejected" });
      onChanged();
      onClose();
    } catch {
      showToast({ type: "error", message: "Couldn't update this report. Please try again." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <CenterModal
      isOpen={isOpen && Boolean(report)}
      onClose={onClose}
      title={`Review report: ${TYPE_LABELS[report?.reportType ?? ""] ?? "Report"}`}
      width={640}
      hideFooter
    >
      {report && (
        <div className="flex flex-col gap-4">
          <Field label="What was reported">{report.title || "-"}</Field>
          <Field label="Reason given">{report.rawReason || report.reason || "-"}</Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reported by">{report.profile_name || "-"}</Field>
            <Field label="Reported on">{report.report_time ? formatDisplayDate(report.report_time) : "-"}</Field>
          </div>
          <Field label="Status">{report.report_status}</Field>
          {href && (
            <Link href={href} className="text-sm font-semibold text-gray-900 underline">
              Open the reported {report.reportedUserRole}&apos;s record
            </Link>
          )}
          <p className="text-xs text-gray-600">
            The reporter&apos;s identity is visible to moderators only. The reported person is not notified.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              onClick={() => update("rejected")}
              loading={busy === "rejected"}
              disabled={Boolean(busy) || report.report_status === "rejected"}
              icon={<MdClose className="text-[1.1rem]" />}
              className="w-[150px] text-sm h-9 !bg-error-light !border-none rounded-xl py-2 !text-error"
            >
              Reject
            </Button>
            <Button
              onClick={() => update("resolved")}
              loading={busy === "resolved"}
              disabled={Boolean(busy) || report.report_status === "resolved"}
              icon={<IoMdCheckmark className="text-[1.1rem]" />}
              className="w-[150px] text-sm h-9 !bg-[#DCFCE7] !border-none rounded-xl py-2 !text-success"
            >
              Resolve
            </Button>
          </div>
        </div>
      )}
    </CenterModal>
  );
};

export default PersonReportModal;
