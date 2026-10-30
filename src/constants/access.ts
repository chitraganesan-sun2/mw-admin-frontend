// Which admin-portal pages each permission opens. This only decides what the UI SHOWS and where
// to redirect - it is not a security boundary. Every API enforces the same rules on the server
// (melody-wings-backend: utils/rbac.py + AuthHandler.require_permission), so a hidden link or a
// hand-edited token still gets 401/403 from the API.
//
// What an account can open is decided by the server (GET /admin/auth/me): its role's defaults, or
// the custom switches an admin set for it on the Accounts page.

export type Permission =
  | "applications.read"
  | "applications.review"
  | "members.manage"
  | "hiring.read"
  | "profile_changes.review"
  | "matching.manage"
  | "reports.manage"
  | "resources.manage"
  | "community.manage"
  | "broadcast.send"
  | "safety.monitor"
  | "donations.read"
  | "notifications.manage"
  | "skills.manage"
  | "tutorials.manage"
  | "admins.manage";

export type StaffRole = "admin" | "support";

export interface Staff {
  user_id: string;
  username: string | null;
  role: StaffRole;
  home_path: string;
  permissions: Permission[];
}

// Path prefix -> the permission needed to open it (null = any signed-in portal user). A path not
// listed here is admin-only (the default for anything new): it needs `admins.manage`.
const PAGE_PERMISSIONS: Array<{ prefix: string; permission: Permission | null }> = [
  { prefix: "/dashboard", permission: null },
  { prefix: "/support", permission: null },
  { prefix: "/volunteer", permission: "applications.read" },
  { prefix: "/learner", permission: "applications.read" },
  { prefix: "/hiring", permission: "hiring.read" },
  { prefix: "/profile-changes", permission: "profile_changes.review" },
  { prefix: "/matching", permission: "matching.manage" },
  { prefix: "/reports", permission: "reports.manage" },
  { prefix: "/resources", permission: "resources.manage" },
  { prefix: "/community", permission: "community.manage" },
  { prefix: "/broadcast", permission: "broadcast.send" },
  { prefix: "/safety", permission: "safety.monitor" },
  { prefix: "/donations", permission: "donations.read" },
  { prefix: "/notifications", permission: "notifications.manage" },
  { prefix: "/list-of-values", permission: "skills.manage" },
  { prefix: "/tutorial-links", permission: "tutorials.manage" },
  { prefix: "/accounts", permission: "admins.manage" },
  { prefix: "/access-denied", permission: null },
];

const ADMIN_ONLY: Permission = "admins.manage";

export const requiredPermissionFor = (pathname: string): Permission | null => {
  const hit = PAGE_PERMISSIONS.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`));
  return hit ? hit.permission : ADMIN_ONLY;
};

export const canAccessPath = (pathname: string, permissions: readonly string[]): boolean => {
  const needed = requiredPermissionFor(pathname);
  return needed === null || permissions.includes(needed);
};

// Roles the portal knows how to route (anything else is treated as "no access").
export const KNOWN_ROLES: StaffRole[] = ["admin", "support"];

// Where each role lands after signing in; the server's `home_path` is preferred, this is the
// fallback if an older server doesn't send it.
export const ROLE_HOME: Record<StaffRole, string> = {
  admin: "/dashboard",
  support: "/support",
};

const KNOWN_HOMES = new Set(Object.values(ROLE_HOME));

/** Only ever navigate to a home path we recognise (the value comes from a network response). */
export const safeHomePath = (candidate: unknown, role: unknown): string => {
  if (typeof candidate === "string" && KNOWN_HOMES.has(candidate)) return candidate;
  return ROLE_HOME[(role as StaffRole)] ?? "/access-denied";
};
