// Session status vocabulary, kept identical to the member app (melody-wings-frontend
// ScheduleSessionCard / CalendarLegend) so an admin and a member describing the same session use
// the same word: "Accepted" (not "Confirmed"), "Declined", and an unanswered request whose time has
// passed is "Expired" rather than still "Pending".
//
// Dates are the one deliberate difference: the member app writes long dates ("November 24, 2026")
// for individual people; the admin console uses the compact "24 Nov 2026, 8:45 PM" everywhere
// (utils/displayDateTime.ts) because it shows many rows side by side.
//
// The Join link also differs on purpose: members lose it when the session ends, admins keep it for
// JOIN_GRACE_MINUTES after the end (backend JOIN_GRACE) so a session that overran can still be joined
// to look in on it.
import { serverTimeMs } from "./displayDateTime.ts";

export const JOIN_GRACE_MINUTES = 30;

export const SESSION_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "gold" },
  expired: { label: "Expired", color: "default" },
  accepted: { label: "Accepted", color: "green" },
  completed: { label: "Completed", color: "blue" },
  cancelled: { label: "Cancelled", color: "default" },
  rejected: { label: "Declined", color: "red" },
};

/** The status to show: "expired" for a pending request whose end (or start, if no end) is past. */
export function sessionStatusKey(
  row: { status: string; start_utc?: string | null; end_utc?: string | null },
  now: number = Date.now()
): string {
  if (row.status !== "pending") return row.status;
  const t = serverTimeMs(row.end_utc ?? row.start_utc);
  return Number.isFinite(t) && t <= now ? "expired" : "pending";
}

export function sessionStatusDisplay(
  row: { status: string; start_utc?: string | null; end_utc?: string | null },
  now?: number
): { label: string; color: string } {
  const key = sessionStatusKey(row, now);
  return SESSION_STATUS_LABEL[key] ?? { label: key, color: "default" };
}
