// Shape of GET admin/dashboard/summary (melody-wings-backend, controllers/v1/admin_dashboard.py).
// A section the signed-in account may not see is simply absent, so every part of `numbers` and
// `health` is optional.

interface DashboardAttentionItem {
  key: string;
  label: string;
  count: number;
  href: string;
}

interface DashboardSummary {
  attention: DashboardAttentionItem[];
  numbers: {
    members?: { volunteers: number; learners: number; new_volunteers_30d: number; new_learners_30d: number };
    donations?: { count_30d: number; total_30d: number };
    hiring?: { new_applications_7d: number };
  };
  health: {
    email?: { failed_7d: number; total_7d: number };
  };
  // Sections that could not be loaded just now (the rest of the page is still correct).
  unavailable: string[];
  cache_seconds: number;
  generated_at: string;
}

type DashboardSessionStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

interface DashboardSession {
  session_id: string;
  title: string | null;
  status: DashboardSessionStatus | string;
  kind: "regular" | "instant";
  // Both in UTC (ISO 8601); null when the stored date/time can't be read.
  start_utc: string | null;
  end_utc: string | null;
  volunteer_id: string | null;
  volunteer_name: string | null;
  learner_id: string | null;
  learner_name: string | null;
  // Only for a confirmed session that hasn't ended, and only an https link.
  join_url: string | null;
}

interface DashboardSessionList {
  sessions: DashboardSession[];
  total: number;
  page: number;
  size: number;
}

interface DashboardSessionFilters {
  status?: string;
  kind?: string;
  when?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  order?: "asc" | "desc";
  page?: number;
  size?: number;
}
