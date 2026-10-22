// Which admin-portal pages each permission opens. This only decides what the UI SHOWS and where
// to redirect - it is not a security boundary. Every API enforces the same rules on the server
// (melody-wings-backend: utils/rbac.py + AuthHandler.require_permission), so a hidden link or a
// hand-edited token still gets 401/403 from the API.

export type Permission =
  | "applications.read"
  | "applications.review"
  | "hiring.read"
  | "profile_changes.review"
  | "donations.read"
  | "notifications.manage"
  | "skills.manage"
  | "admins.manage";

export type StaffRole = "admin" | "support";

export interface Staff {
  user_id: string;
  username: string | null;
  role: StaffRole;
  home_path: string;
  permissions: Permission[];
}

// Path prefix -> the permission needed to open it. A path not listed here is admin-only
// (the default for anything new): only an account holding every permission may open it.
const PAGE_PERMISSIONS: Array<{ prefix: string; permission: Permission | null }> = [
  { prefix: "/support", permission: "applications.read" },
  { prefix: "/volunteer", permission: "applications.read" },
  { prefix: "/learner", permission: "applications.read" },
  { prefix: "/hiring", permission: "hiring.read" },
  { prefix: "/profile-changes", permission: "profile_changes.review" },
  { prefix: "/donations", permission: "donations.read" },
  { prefix: "/notifications", permission: "notifications.manage" },
  { prefix: "/list-of-values", permission: "skills.manage" },
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

// UX-only mirror of the server's role -> permission map (utils/rbac.py), used by the edge
// middleware, which can read the role claim from the cookie but cannot call the API. The portal
// pages themselves use useStaff() (the server's answer) instead.
export const ROLE_PERMISSIONS_UX: Record<StaffRole, Permission[]> = {
  admin: [
    "applications.read",
    "applications.review",
    "hiring.read",
    "profile_changes.review",
    "donations.read",
    "notifications.manage",
    "skills.manage",
    "admins.manage",
  ],
  support: ["applications.read", "applications.review", "hiring.read", "profile_changes.review"],
};

// Roles the portal knows how to route (anything else is treated as "no access").
export const KNOWN_ROLES: StaffRole[] = ["admin", "support"];

// Where each role lands after signing in; the server's `home_path` is preferred, this is the
// fallback if an older server doesn't send it.
export const ROLE_HOME: Record<StaffRole, string> = {
  admin: "/volunteer",
  support: "/support",
};

const KNOWN_HOMES = new Set(Object.values(ROLE_HOME));

/** Only ever navigate to a home path we recognise (the value comes from a network response). */
export const safeHomePath = (candidate: unknown, role: unknown): string => {
  if (typeof candidate === "string" && KNOWN_HOMES.has(candidate)) return candidate;
  return ROLE_HOME[(role as StaffRole)] ?? "/access-denied";
};
