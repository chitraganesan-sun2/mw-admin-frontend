import { endpoints } from "../constants";
import { GET_API, PUT_API } from "../request";

export const getReportStatus = async (report_id: string) => {
    const endpoint = endpoints.report.getReportStatus(report_id);
    const response = await GET_API(endpoint);
    return response;
}

export const getReportsByType = async (report_type: string, params?: any) => {
    const endpoint = endpoints.report.getAllReports(report_type);
    const response = await GET_API(`${endpoint}?${new URLSearchParams({ ...params })}`);
    return response;
}

export const resolveReport = async (report_id: string) => {
    const endpoint = endpoints.report.resolveReport(report_id);
    const { status } = await PUT_API(endpoint, { report_status: "resolved" });
    return status;
}

export const rejectReport = async (report_id: string) => {
    const endpoint = endpoints.report.rejectReport(report_id);
    const { status } = await PUT_API(endpoint, { report_status: "rejected" });
    return status;
}
