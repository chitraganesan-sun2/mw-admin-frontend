import dayjs from "dayjs";

export type WingTimeStatus = "pending_approval" | "approved" | "rejected" | "cancelled" | "completed";

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
