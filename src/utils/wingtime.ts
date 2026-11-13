import dayjs from "dayjs";

export type WingTimeStatus = "pending_approval" | "approved" | "rejected" | "cancelled" | "completed";

/** Where a session recording is in its life: collected privately, then published to Resources (or not). */
export type RecordingStatus =
  | "requested"
  | "unavailable"
  | "pending_review"
  | "publishing"
  | "published"
  | "rejected"
  | "unpublished";

export const RECORDING_STATUS_LABEL: Record<RecordingStatus, string> = {
  requested: "Waiting for recording",
  unavailable: "Not recorded",
  pending_review: "Needs review",
  publishing: "Publishing...",
  published: "In Resources",
  rejected: "Not published",
  unpublished: "Removed from Resources",
};

/** A WingTime as the admin API returns it (includes the host id and review trail). */
export interface AdminWingTime {
  wingtime_id: string;
  topic: string;
  description: string;
  materials: string;
  tags: string[];
  host_name: string | null;
  host_volunteer_id?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  start_utc: string;
  end_utc: string;
  duration_minutes: number;
  capacity: number;
  registered_count: number;
  spots_left: number;
  status: WingTimeStatus;
  meeting_link?: string | null;
  reject_reason?: string | null;
  created_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  recording_status?: RecordingStatus | null;
  recording_url?: string | null;
  recording_resource_id?: string | null;
  transcript_status?: string | null;
  safety_report_id?: number | null;
  safety?: { status?: string | null; severity?: string | null } | null;
}

/** What an admin should read from a session's safety analysis before publishing its recording. */
export type SafetyState =
  | { kind: "none" } // no transcript to analyse (nobody spoke, or transcription wasn't available)
  | { kind: "waiting" } // transcript still being collected or the analysis is still running
  | { kind: "done"; severity: string; flagged: boolean; reportId: number };

export function safetyState(w: Pick<AdminWingTime, "transcript_status" | "safety_report_id" | "safety">): SafetyState {
  if (w.transcript_status === "requested" || w.transcript_status === "submitting") return { kind: "waiting" };
  if (w.safety_report_id == null) return { kind: "none" };
  if (w.safety?.status !== "COMPLETED") return { kind: "waiting" };
  const severity = (w.safety.severity ?? "none").toLowerCase();
  return { kind: "done", severity, flagged: severity === "high" || severity === "critical", reportId: w.safety_report_id };
}

export interface AdminWingTimePage {
  items: AdminWingTime[];
  total: number;
  page: number;
  size: number;
}

export interface RosterParticipant {
  learner_id: string;
  name: string;
  registered_at: string | null;
}

export const WINGTIME_TABS: { key: WingTimeStatus; label: string }[] = [
  { key: "pending_approval", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export const WINGTIME_STATUS_LABEL: Record<WingTimeStatus, string> = Object.fromEntries(
  WINGTIME_TABS.map((t) => [t.key, t.label])
) as Record<WingTimeStatus, string>;

/** "05 Nov 2026, 3:00 PM - 3:30 PM (America/New_York)" - in the HOST's time zone, which is the
 * zone they typed it in and the one an admin reviewing it should reason about. */
export function whenInHostZone(w: Pick<AdminWingTime, "date" | "start_time" | "end_time" | "timezone">): string {
  const time = (t: string) => dayjs(`2000-01-01T${t}`).format("h:mm A");
  return `${dayjs(w.date).format("DD MMM YYYY")}, ${time(w.start_time)} - ${time(w.end_time)} (${w.timezone})`;
}

/** Has the session finished? (Only then can it be marked completed.) */
export function hasEnded(w: Pick<AdminWingTime, "end_utc">, now = dayjs()): boolean {
  return dayjs(w.end_utc).isBefore(now);
}
