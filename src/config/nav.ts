// The admin portal's navigation, as data. The sidebar and the quick-jump palette both read this,
// so a new page is added in one place. Icons live in the components (this file stays plain TS so it
// can be unit-tested without a bundler).
import { canAccessPath } from "../constants/access.ts";

export type NavIconKey =
  | "dashboard"
  | "support"
  | "volunteers"
  | "learners"
  | "accounts"
  | "profile-changes"
  | "matching"
  | "wingtime"
  | "safety"
  | "reports"
  | "community"
  | "resources"
  | "feedback"
  | "donations"
  | "hiring"
  | "broadcast"
  | "notifications"
  | "tutorials"
  | "lov"
  | "audit";

export interface NavItem {
  href: string;
  text: string;
  icon: NavIconKey;
  /** Extra words the quick-jump search should match (not shown). */
  keywords?: string[];
  /** Only shown to this role (e.g. the Support home is for support accounts). */
  role?: "support";
  /** Only shown where the feature is switched on. */
  flag?: "wingtime";
}

export interface NavGroup {
  /** null = no heading (the Dashboard sits above the labelled groups). */
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", text: "Dashboard", icon: "dashboard", keywords: ["home", "overview", "sessions"] },
      { href: "/support", text: "Support", icon: "support", role: "support", keywords: ["home"] },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/volunteer", text: "Volunteers", icon: "volunteers", keywords: ["applications", "approve"] },
      { href: "/learner", text: "Learners", icon: "learners", keywords: ["applications", "students"] },
      { href: "/matching", text: "Matching", icon: "matching", keywords: ["pair", "waitlist"] },
      { href: "/profile-changes", text: "Profile Changes", icon: "profile-changes", keywords: ["review", "edit"] },
      { href: "/hiring", text: "Hiring", icon: "hiring", keywords: ["careers", "applications", "resume"] },
      { href: "/accounts", text: "Accounts", icon: "accounts", keywords: ["staff", "admins", "permissions", "roles"] },
    ],
  },
  {
    label: "Safety & review",
    items: [
      { href: "/safety", text: "Safety Monitoring", icon: "safety", keywords: ["analysis", "chats", "red alert", "transcripts"] },
      { href: "/wingtime", text: "WingTime", icon: "wingtime", flag: "wingtime", keywords: ["recordings", "groups", "publish"] },
      { href: "/reports", text: "Member Reports", icon: "reports", keywords: ["flagged", "moderation", "abuse"] },
      { href: "/session-feedback", text: "Session Feedback", icon: "feedback", keywords: ["helpful", "goal", "ratings"] },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/community", text: "Community", icon: "community", keywords: ["posts", "comments", "feed"] },
      { href: "/resources", text: "Resources", icon: "resources", keywords: ["library", "files", "videos"] },
      { href: "/tutorial-links", text: "Tutorial Links", icon: "tutorials", keywords: ["help", "videos"] },
    ],
  },
  {
    label: "Outreach & money",
    items: [
      { href: "/donations", text: "Donations", icon: "donations", keywords: ["payments", "giving"] },
      { href: "/broadcast", text: "Email Broadcast", icon: "broadcast", keywords: ["mail", "newsletter", "send"] },
      { href: "/notifications", text: "Notifications", icon: "notifications", keywords: ["email", "recipients", "alerts"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/list-of-values", text: "List of Values", icon: "lov", keywords: ["skills", "options", "dropdowns", "lov"] },
      { href: "/audit-log", text: "Audit Log", icon: "audit", keywords: ["history", "who did", "admin actions", "trail"] },
    ],
  },
];

export interface NavContext {
  permissions: readonly string[];
  role?: string;
  wingtimeEnabled: boolean;
}

const visible = (item: NavItem, ctx: NavContext): boolean =>
  (!item.role || item.role === ctx.role) &&
  (item.flag !== "wingtime" || ctx.wingtimeEnabled) &&
  canAccessPath(item.href, ctx.permissions);

/** The groups this account sees: pages it may open, with empty groups dropped. */
export function visibleNavGroups(ctx: NavContext, groups: NavGroup[] = NAV_GROUPS): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => visible(i, ctx)) }))
    .filter((g) => g.items.length > 0);
}

/** Flat list for the quick-jump palette, each item tagged with its group. */
export function flattenNav(groups: NavGroup[]): Array<NavItem & { group: string | null }> {
  return groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
}

/** Rank matches for the quick-jump search: name prefix > name contains > keyword/group contains. */
export function searchNav<T extends NavItem & { group: string | null }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const scored: Array<{ item: T; score: number }> = [];
  for (const item of items) {
    const name = item.text.toLowerCase();
    let score = 0;
    if (name.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 2;
    else if ((item.keywords ?? []).some((k) => k.toLowerCase().includes(q)) || (item.group ?? "").toLowerCase().includes(q)) score = 1;
    if (score > 0) scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}

/** The nav item (and group label) a pathname belongs to, for the page header's breadcrumb. */
export function findNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS): { item: NavItem; group: string | null } | null {
  for (const g of groups) {
    for (const item of g.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return { item, group: g.label };
    }
  }
  return null;
}
