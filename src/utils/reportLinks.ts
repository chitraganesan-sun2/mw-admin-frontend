/** Where a moderator can open the reported person's record, or null when it can't be known. */
export function reportedUserHref(report?: {
  reportedUserId?: string;
  reportedUserRole?: "learner" | "volunteer";
}): string | null {
  if (!report?.reportedUserId) return null;
  if (report.reportedUserRole === "volunteer") return `/volunteer?volunteer_id=${encodeURIComponent(report.reportedUserId)}`;
  if (report.reportedUserRole === "learner") return `/learner?learner_id=${encodeURIComponent(report.reportedUserId)}`;
  return null;
}
