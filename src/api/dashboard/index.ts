import { endpoints } from "../constants";
import { GET_API } from "../request";

// The API wraps the payload as { success, data }; resolve to the payload.
export const getDashboardSummary = async (): Promise<DashboardSummary> =>
  (await GET_API(endpoints.dashboard.summary))?.data?.data as DashboardSummary;
