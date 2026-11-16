// How long something has been waiting for review, so the oldest items stand out in a queue.

export type WaitingLevel = "fresh" | "aging" | "overdue";

export interface Waiting {
  days: number;
  text: string;
  level: WaitingLevel;
}

export const AGING_AFTER_DAYS = 2;
export const OVERDUE_AFTER_DAYS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Today", "1 day", "4 days" since `since`; null when the date is missing or unreadable. */
export function waitingSince(since: string | number | Date | null | undefined, now: number = Date.now()): Waiting | null {
  if (!since) return null;
  const t = new Date(since).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.max(0, Math.floor((now - t) / DAY_MS));
  const level: WaitingLevel = days >= OVERDUE_AFTER_DAYS ? "overdue" : days >= AGING_AFTER_DAYS ? "aging" : "fresh";
  const text = days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`;
  return { days, text, level };
}
