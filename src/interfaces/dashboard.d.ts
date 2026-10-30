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
