// Shapes returned by the Safety Monitoring API (admin/safety/*, melody-wings-backend). They mirror what
// the detection pipeline actually sends; fields it may omit are optional. Verified against a live
// service, not guessed.

type SafetyStatus = "PROCESSING" | "COMPLETED" | "FAILED" | string;
type SafetySeverity = "Safe" | "Low" | "Moderate" | "High" | "Critical";

interface SafetyReportRow {
  id: number;
  filename: string;
  status: SafetyStatus;
  severity: SafetySeverity | null;
  risk_score: number | null;
  created_at: string | null;
  // The MelodyWings records this analysis is about, when it was linked to one.
  session_id: string | null;
  volunteer_id: string | null;
  learner_id: string | null;
}

interface SafetyReportList {
  reports: SafetyReportRow[];
  total: number;
  skip: number;
  limit: number;
}

interface SafetyEvidenceItem {
  timestamp?: number;
  category: string;
  categories?: string[];
  severity: string; // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" (upper case)
  confidence: number; // 0..1
  evidence: string; // the quoted text
  speaker?: string;
  context_type?: string;
  matched_text?: string;
  base_confidence?: number;
  context_multiplier?: number;
  is_joke?: boolean;
  is_negation?: boolean;
  [key: string]: unknown;
}

interface SafetyTimelineSegment {
  start: number;
  end: number;
  text: string;
  [key: string]: unknown;
}

interface SafetyReportStats {
  categories: Record<string, number>;
  confidence_stats?: Record<string, number>;
  severity_distribution?: Record<string, number>;
  context_type_distribution?: Record<string, number>;
  ml_stats?: Record<string, unknown>;
  word_count?: number | null;
  finding_count: number;
  unique_categories?: number;
}

interface SafetyReport {
  id: number;
  filename: string;
  status: SafetyStatus;
  error_message: string | null;
  severity: SafetySeverity | null;
  risk_score: number | null;
  created_at: string | null;
  transcript: string;
  summary: string;
  llm_summary: string | null;
  findings: Array<Record<string, unknown>>;
  evidence: SafetyEvidenceItem[];
  timeline: SafetyTimelineSegment[];
  stats: SafetyReportStats | Record<string, never>;
  session_id: string | null;
  volunteer_id: string | null;
  learner_id: string | null;
}

interface SafetyReportStatus {
  id: number;
  status: SafetyStatus;
  error_message: string | null;
}

interface SafetyAcceptedAnalysis {
  message: string;
  report_id: number;
  filename: string;
  status: "PROCESSING";
}

interface SafetyAnalysisLinks {
  session_id?: string;
  volunteer_id?: string;
  learner_id?: string;
}

interface SafetyAnalyticsSummary {
  total_reports: number;
  total_findings: number;
  avg_risk_score: number;
  high_confidence_count: number;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  risk_score_histogram: unknown;
  top_categories: unknown;
  context_type_totals: unknown;
  ml_agreement_totals: unknown;
  confidence_histogram: unknown;
  [key: string]: unknown;
}

interface SafetyChatAnswer {
  answer: string;
  sources?: unknown[] | null;
  confidence?: number | null;
}

interface SafetyDriveStatus {
  authenticated: boolean;
  message: string;
}

interface SafetyDriveWatcherStatus {
  running: boolean;
  last_checked: string | null;
  files_processed: number;
  errors: number;
  poll_interval_seconds: number;
  [key: string]: unknown;
}

interface SafetyBulkDeleteResult {
  deleted: number[];
  not_found: number[];
  total_requested: number;
}
