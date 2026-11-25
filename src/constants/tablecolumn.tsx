import React from "react";
import { Volunteer, Report, Learner } from "@/constants/column";
import ExpandableText from "@/components/common/Modals/ExpandableText";
import { Button } from "antd";
import DeleteButton from "@/components/common/DeleteButton";
import StatusTag from "@/components/common/StatusTag";
import { toneFromStatus } from "@/utils/statusTone";
import { FaSort } from "react-icons/fa";
import { formatDisplayDate } from "@/utils/moment";
import { formatMoney } from "@/components/dashboard/widgets";

// Column widths below are explicit on purpose: the shared Table renders a fixed layout when every column is sized,
// which is what keeps each header over its cells (the widths per table add up to about 1000px, the content area
// at a 1280px screen). The Actions column is pinned right so it never sits off-screen.

export interface DonationRow {
  id: string;
  donor_name: string;
  email: string;
  donation_date: string; // ISO string preferred
  amount: number; // in dollars
}

export const getDonationColumns = (onViewMore?: (row: DonationRow) => void) => [
  {
    title: "Donor Name",
    dataIndex: "donor_name",
    key: "donor_name",
    sorter: false,
    width: 200,
    ellipsis: true,
    render: (_: unknown, record: DonationRow) => (
      <span className="font-semibold text-ink !normal-case">{record?.donor_name || "Anonymous"}</span>
    ),
  },
  {
    title: "Email Address",
    dataIndex: "email",
    key: "email",
    sorter: false,
    width: 260,
    ellipsis: true,
    render: (_: unknown, record: DonationRow) => (
      <span className="text-ink !normal-case">{record?.email?.toLowerCase?.() || "-"}</span>
    ),
  },
  {
    title: "Date",
    dataIndex: "donation_date",
    key: "donation_date",
    sorter: false,
    width: 140,
    className: "whitespace-nowrap",
    render: (_: unknown, record: DonationRow) => {
      if (!record.donation_date) return "-";
      return <span className="text-ink !normal-case">{formatDisplayDate(record.donation_date)}</span>;
    },
  },
  {
    // Right-aligned with tabular numerals so amounts line up and the header sits above them.
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    sorter: false,
    width: 120,
    align: "right" as const,
    className: "whitespace-nowrap",
    render: (_: unknown, record: DonationRow) => (
      <span className="font-medium tabular-nums text-ink !normal-case">
        {record?.amount != null ? formatMoney(record.amount) : "-"}
      </span>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 110,
    fixed: "right" as const,
    align: "right" as const,
    render: (_: unknown, record: DonationRow) => (
      <Button
        size="small"
        aria-label={`View donation from ${record?.donor_name || "anonymous donor"}`}
        onClick={(e) => {
          e.stopPropagation();
          onViewMore?.(record);
        }}
      >
        View
      </Button>
    ),
  },
];

// "Approval Status" is a priority sort (the backend ranks the chosen status first), not a
// filter. The cycle used to have no way back to the default order and gave no hint of
// which status was on top.
export const STATUS_SORT_CYCLE: (string | null)[] = [
  null,
  "verification_completed",
  "verification_pending",
  "partially_filled",
  "details_pending",
  "verification_rejected",
];
// One label per status, used by the Status cell AND the sort control (they used to disagree:
// the cell said "Details Pending" where the sort said "Partially Filled").
export const STATUS_LABEL: Record<string, string> = {
  verification_completed: "Completed",
  verification_pending: "Approval Pending",
  partially_filled: "Form In Progress",
  details_pending: "Form Incomplete",
  verification_rejected: "Rejected",
};
const STATUS_SORT_LABEL = STATUS_LABEL;
export const nextStatusSort = (current: string | null) =>
  STATUS_SORT_CYCLE[(STATUS_SORT_CYCLE.indexOf(current) + 1) % STATUS_SORT_CYCLE.length];

const statusSortTitle = (handler?: () => void, active?: string | null) => {
  const activeLabel = active ? STATUS_SORT_LABEL[active] : null;
  return (
    <button
      type="button"
      onClick={handler}
      aria-label={`Sort by approval status${activeLabel ? ` (currently: ${activeLabel} first)` : ""}`}
      className="flex h-full w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap border-0 bg-transparent pr-2 text-left font-[inherit] text-[inherit]"
    >
      <span className="flex flex-col">
        Approval Status
        {activeLabel && <span className="text-xs font-normal text-gray-medium">{activeLabel} first</span>}
      </span>
      <FaSort className={activeLabel ? "text-brand-ink" : "text-ink-3"} />
    </button>
  );
};

// One status cell for Volunteers and Learners: the shared StatusTag with a dot (AA colours); the label is the same
// one the sort control uses.
type PersonKind = "volunteer" | "learner";

// Onboarding tabs per role (the form's last tab index is total - 1). Keep in step with the user app's form.
const ONBOARDING_STEPS: Record<PersonKind, number> = { learner: 7, volunteer: 6 };
const REMINDER_MAX = 2;
const REMINDER_COOLDOWN_DAYS = 7;
const INCOMPLETE_STATUSES = ["details_pending", "partially_filled"];

// Where someone who hasn't submitted the form stopped. `onboarding_step` is the 0-based tab they last moved to, so
// the step they are on is that + 1; none saved yet means they never started.
const progressLabel = (record: any, kind: PersonKind): string | null => {
  if (!INCOMPLETE_STATUSES.includes(record?.onboarded_status)) return null;
  const step = record?.onboarding_step;
  if (record.onboarded_status === "details_pending" || typeof step !== "number") {
    return record.onboarded_status === "details_pending" ? "Not started" : "Started, no step saved";
  }
  return `Stopped at step ${step + 1} of ${ONBOARDING_STEPS[kind]}`;
};

// Whether the "Remind" button is live for a row, mirroring the server's rule (2 reminders, 7 days apart).
const reminderState = (record: any): { text: string | null; blockedWhy: string | null } => {
  const count = record?.onboarding_reminder_count ?? 0;
  const last = record?.onboarding_last_reminded_at ? new Date(record.onboarding_last_reminded_at) : null;
  const text = count > 0 ? `Reminded ${count}x${last ? `, last ${formatDisplayDate(record.onboarding_last_reminded_at)}` : ""}` : null;
  if (count >= REMINDER_MAX) return { text, blockedWhy: "Both reminders have already been sent" };
  if (last && Date.now() - last.getTime() < REMINDER_COOLDOWN_DAYS * 24 * 3600 * 1000) {
    return { text, blockedWhy: `Reminded in the last ${REMINDER_COOLDOWN_DAYS} days` };
  }
  return { text, blockedWhy: null };
};

const OnboardedStatusCell = ({ record, kind }: { record: any; kind: PersonKind }) => {
  const progress = progressLabel(record, kind);
  const { text: reminded } = progress ? reminderState(record) : { text: null };
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusTag dot tone={toneFromStatus(record?.onboarded_status)}>
        {STATUS_LABEL[record?.onboarded_status ?? ""] ?? "Form Incomplete"}
      </StatusTag>
      {progress && <span className="text-xs text-ink-2">{progress}</span>}
      {reminded && <span className="text-xs text-ink-3">{reminded}</span>}
    </div>
  );
};

// Name | Age | Location | Email | Registered | Approval Status | Actions (pinned right). View + delete share the
// pinned column so they never sit off-screen (ADM-UI-2); delete is an icon-only 32x32 danger button and the
// confirm modal still guards it.
const getPersonColumns = (
  kind: PersonKind,
  handleSeeMoreDetails?: (id: string) => void,
  handleDelete?: (id: string) => void,
  handleOnboardedStatusFilter?: () => void,
  activeStatusSort?: string | null,
  canDelete = true,
  onRemind?: (id: string) => void,
  remindingId?: string | null
) => {
  const idOf = (record: any): string => (kind === "volunteer" ? record?.volunteer_id : record?.learner_id);
  return [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      field: "name",
      sorter: true,
      width: 170,
      ellipsis: true,
      className: "!font-semibold text-ink",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      field: "age",
      sorter: true,
      width: 80,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      sorter: false,
      width: 130,
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: false,
      width: 210,
      ellipsis: true,
      // Lowercased in the cell only - a column-level `lowercase` class also lowercased the header.
      render: (_: unknown, record: { email?: string }) => (
        <span className="text-ink !normal-case">{record?.email?.toLowerCase?.() || "-"}</span>
      ),
    },
    {
      title: "Registered",
      dataIndex: "created_on",
      key: "created_on",
      field: "created_on",
      sorter: true,
      width: 130,
      className: "whitespace-nowrap",
      render: (_: unknown, record: Volunteer | Learner) => {
        const date = (record as any)?.created_on;
        if (!date) return "-";
        return formatDisplayDate(date);
      },
    },
    {
      title: statusSortTitle(handleOnboardedStatusFilter, activeStatusSort),
      dataIndex: "onboarded_status",
      key: "onboarded_status",
      onFilter: (value: string, record: Volunteer | Learner) => record.onboarded_status === value,
      sorter: false,
      width: 200,
      render: (_: unknown, record: Volunteer | Learner) =>
        "onboarded_status" in record ? <OnboardedStatusCell record={record} kind={kind} /> : null,
    },
    {
      title: "Actions",
      key: "actions",
      width: onRemind ? 210 : 130,
      fixed: "right" as const,
      align: "right" as const,
      render: (_: unknown, record: any) => (
        <div className="flex items-center justify-end gap-2">
          {onRemind && INCOMPLETE_STATUSES.includes(record.onboarded_status) && (
            <span title={reminderState(record).blockedWhy ?? "Email a reminder to finish the form"}>
              <Button
                size="small"
                disabled={!!reminderState(record).blockedWhy || remindingId === idOf(record)}
                aria-label={`Send reminder to ${record?.name && record.name !== "-" ? record.name : `this ${kind}`}`}
                onClick={() => onRemind(idOf(record))}
              >
                Remind
              </Button>
            </span>
          )}
          {record.onboarded_status === "details_pending" ? (
            <span className="text-ink-3" aria-label="No details yet">
              -
            </span>
          ) : (
            <Button
              size="small"
              aria-label={`View details for ${record?.name && record.name !== "-" ? record.name : kind}`}
              onClick={() => handleSeeMoreDetails?.(idOf(record))}
            >
              View
            </Button>
          )}
          {canDelete && <DeleteButton label={`Delete ${kind}`} onClick={() => handleDelete?.(idOf(record))} />}
        </div>
      ),
    },
  ];
};

export const getVolunteerColumns = (
  handleSeeMoreDetails?: (id: string) => void,
  handleDeleteVolunteer?: (id: string) => void,
  handleOnboardedStatusFilter?: () => void,
  activeStatusSort?: string | null,
  canDelete = true,
  onRemind?: (id: string) => void,
  remindingId?: string | null
) =>
  getPersonColumns(
    "volunteer", handleSeeMoreDetails, handleDeleteVolunteer, handleOnboardedStatusFilter, activeStatusSort, canDelete,
    onRemind, remindingId
  );

export const getLearnerColumns = (
  handleSeeMoreDetails?: (id: string) => void,
  handleDeleteLearner?: (id: string) => void,
  handleOnboardedStatusFilter?: () => void,
  activeStatusSort?: string | null,
  canDelete = true,
  onRemind?: (id: string) => void,
  remindingId?: string | null
) =>
  getPersonColumns(
    "learner", handleSeeMoreDetails, handleDeleteLearner, handleOnboardedStatusFilter, activeStatusSort, canDelete,
    onRemind, remindingId
  );

export const getReportColumns = (
  handleSeePost?: (id: string, reportId?: string) => void,
  actionLabel = "See post"
) => [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    sorter: false,
    width: 200,
    ellipsis: true,
    className: "!font-semibold text-ink",
  },
  {
    title: "Reported By",
    dataIndex: "profile_name",
    key: "profile_name",
    sorter: false,
    width: 150,
    ellipsis: true,
    className: "!font-semibold text-ink",
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
    sorter: false,
    width: 290,
    render: (_: unknown, record: Report) => (
      <div className="flex items-center gap-2 overflow-hidden">
        <ExpandableText text={record.reason} maxLength={120} actionLabel="read&nbsp;more" />
      </div>
    ),
  },
  {
    title: "Reported On",
    dataIndex: "report_time",
    key: "report_time",
    sorter: false,
    width: 130,
    className: "whitespace-nowrap",
    render: (_: unknown, record: Report) => {
      if (!record.report_time) return "-";
      return formatDisplayDate(record.report_time);
    },
  },
  {
    title: "Review Status",
    dataIndex: "review_status",
    key: "review_status",
    sorter: false,
    width: 130,
    render: (_: unknown, record: Report) => (
      <StatusTag dot tone={toneFromStatus(record.report_status)}>
        {record.report_status}
      </StatusTag>
    ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 120,
    fixed: "right" as const,
    align: "right" as const,
    render: (_: unknown, record: Report) => (
      <Button size="small" onClick={() => handleSeePost?.(record.docId, record.reportId)}>
        {actionLabel}
      </Button>
    ),
  },
];

export interface HiringApplicationRow {
  id: string;
  applicant_name: string;
  email: string;
  submission_date: string;
  submission_timestamp?: number;
  hours_per_week?: string;
  has_resume?: boolean;
}

export const getHiringColumns = (onViewApplication?: (row: HiringApplicationRow) => void) => [
  {
    title: "Applicant Name",
    dataIndex: "applicant_name",
    key: "applicant_name",
    sorter: false,
    width: 200,
    ellipsis: true,
    render: (_: unknown, record: HiringApplicationRow) => (
      <span className="font-semibold text-ink">{record?.applicant_name || "-"}</span>
    ),
  },
  {
    title: "Email Address",
    dataIndex: "email",
    key: "email",
    sorter: false,
    width: 240,
    ellipsis: true,
    render: (_: unknown, record: HiringApplicationRow) => (
      <span className="text-ink !normal-case">{record?.email?.toLowerCase?.() || "-"}</span>
    ),
  },
  {
    title: "Submission Date",
    dataIndex: "submission_date",
    key: "submission_date",
    // Server-paginated and already newest-first; a client sorter only reordered the visible page.
    sorter: false,
    width: 150,
    className: "whitespace-nowrap",
  },
  {
    title: "Hours / week",
    dataIndex: "hours_per_week",
    key: "hours_per_week",
    sorter: false,
    width: 120,
    className: "whitespace-nowrap",
    render: (_: unknown, record: HiringApplicationRow) => record?.hours_per_week || "-",
  },
  {
    title: "Resume",
    dataIndex: "has_resume",
    key: "has_resume",
    sorter: false,
    width: 90,
    render: (_: unknown, record: HiringApplicationRow) => (record?.has_resume ? "Yes" : "-"),
  },
  {
    title: "Actions",
    key: "actions",
    width: 150,
    fixed: "right" as const,
    align: "right" as const,
    render: (_: unknown, record: HiringApplicationRow) => (
      <Button
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onViewApplication?.(record);
        }}
      >
        View application
      </Button>
    ),
  },
];
