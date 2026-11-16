import { waitingSince, type WaitingLevel } from "@/utils/waiting";

const STYLES: Record<WaitingLevel, string> = {
  fresh: "bg-background text-gray-medium",
  aging: "bg-warning-light text-warning",
  overdue: "bg-error-light text-error",
};

// "Waiting 4 days": colour grows with age, but the number is always in the text too.
export default function WaitingBadge({ since }: { since?: string | number | Date | null }) {
  const waiting = waitingSince(since);
  if (!waiting) return null;
  return (
    <span className={`inline-block whitespace-nowrap normal-case rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[waiting.level]}`}>
      {waiting.days === 0 ? "New today" : `Waiting ${waiting.text}`}
    </span>
  );
}
