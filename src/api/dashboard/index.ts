import { endpoints } from "../constants";
import { GET_API } from "../request";

// The API wraps the payload as { success, data }; resolve to the payload.
export const getDashboardSummary = async (): Promise<DashboardSummary> =>
  (await GET_API(endpoints.dashboard.summary))?.data?.data as DashboardSummary;

export const listDashboardSessions = async (filters: DashboardSessionFilters): Promise<DashboardSessionList> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return (await GET_API(`${endpoints.dashboard.sessions}?${query.toString()}`))?.data?.data as DashboardSessionList;
};
