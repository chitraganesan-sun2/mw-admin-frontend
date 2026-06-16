/**
 * Safety API Module
 * =================
 * API functions for the safety detection integration.
 * All calls go through the MW backend proxy layer at /api/v1/admin/safety
 */

import { request } from "@/api/api-client";

const SAFETY_BASE = "/admin/safety";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SafetyReport {
  meeting_id: number;
  session_id?: string;
  filename: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  severity?: "Safe" | "Low" | "Moderate" | "High" | "Critical";
  risk_score?: number;
  volunteer_id?: string;
  learner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SafetyReportDetail {
  report_id?: number;
  meeting_id?: number;
  session_id?: string;
  filename?: string;
  status?: string;
  severity?: string;
  risk_score?: number;
  llm_summary?: string;
  rule_summary?: string;
  findings?: any[];
  evidence?: any[];
  transcript?: string;
  timeline?: any[];
  stats?: Record<string, any>;
  created_at?: string;
  completed_at?: string;
  volunteer_id?: string;
  learner_id?: string;
}

export interface SafetyAnalytics {
  total_reports: number;
  total_findings: number;
  avg_risk_score: number;
  severity_distribution: Record<string, number>;
  top_categories: Array<{ category: string; count: number }>;
  high_confidence_count: number;
  status_distribution: Record<string, number>;
}

export interface AnalyzeTranscriptPayload {
  transcript: string;
  filename?: string;
  session_id?: string;
  volunteer_id?: string;
  learner_id?: string;
}

export interface ReportsListResponse {
  reports: SafetyReport[];
  total: number;
  skip: number;
  limit: number;
}

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * Submit a transcript for safety analysis
 */
export const analyzeTranscript = async (payload: AnalyzeTranscriptPayload) => {
  return request({
    url: `${SAFETY_BASE}/analyze/transcript`,
    method: "POST",
    data: payload,
  });
};

/**
 * Upload an audio file for safety analysis
 */
export const analyzeAudio = async (formData: FormData) => {
  return request({
    url: `${SAFETY_BASE}/analyze/audio`,
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Get paginated list of safety reports
 */
export const getReports = async (params?: {
  skip?: number;
  limit?: number;
  severity?: string;
  session_id?: string;
}) => {
  return request({
    url: `${SAFETY_BASE}/reports`,
    method: "GET",
    params,
  });
};

/**
 * Get full details of a specific report
 */
export const getReportDetail = async (reportId: number) => {
  return request({
    url: `${SAFETY_BASE}/reports/${reportId}`,
    method: "GET",
  });
};

/**
 * Get processing status of a report
 */
export const getReportStatus = async (reportId: number) => {
  return request({
    url: `${SAFETY_BASE}/reports/${reportId}/status`,
    method: "GET",
  });
};

/**
 * Get evidence for a specific report
 */
export const getReportEvidence = async (reportId: number) => {
  return request({
    url: `${SAFETY_BASE}/reports/${reportId}/evidence`,
    method: "GET",
  });
};

/**
 * Download PDF report
 */
export const downloadReportPdf = async (reportId: number) => {
  return request({
    url: `${SAFETY_BASE}/reports/${reportId}/pdf`,
    method: "GET",
    responseType: "blob",
  });
};

/**
 * Delete a safety report
 */
export const deleteReport = async (reportId: number) => {
  return request({
    url: `${SAFETY_BASE}/reports/${reportId}`,
    method: "DELETE",
  });
};

/**
 * Get aggregate analytics summary
 */
export const getAnalytics = async () => {
  return request({
    url: `${SAFETY_BASE}/analytics`,
    method: "GET",
  });
};

/**
 * Get rich analytics insights
 */
export const getAnalyticsInsights = async () => {
  return request({
    url: `${SAFETY_BASE}/analytics/insights`,
    method: "GET",
  });
};
