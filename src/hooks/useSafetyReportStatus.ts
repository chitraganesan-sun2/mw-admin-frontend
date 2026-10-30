import { useQuery } from "@tanstack/react-query";
import { getSafetyReportStatus } from "@/api/safety";
import { isInFlight } from "@/components/safety/severity";

/**
 * Polls one report's processing status until it finishes. The pipeline used to push live progress
 * over an unauthenticated WebSocket; through the admin backend it is a status poll instead, which
 * keeps every call authenticated.
 */
export function useSafetyReportStatus(reportId: number | string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["safety-report-status", reportId],
    queryFn: () => getSafetyReportStatus(reportId as number | string),
    enabled: enabled && reportId != null,
    // Keep checking while it is running; stop on COMPLETED/FAILED.
    refetchInterval: (query) => (isInFlight(query.state.data?.status) || !query.state.data ? 3000 : false),
    retry: 1,
  });
}
