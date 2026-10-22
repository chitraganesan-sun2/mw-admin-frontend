// Run with: npm run test:unit   (Node's built-in test runner; no extra dependencies)
import assert from "node:assert/strict";
import { test } from "node:test";

import { canAccessPath, requiredPermissionFor, safeHomePath } from "../../src/constants/access.ts";

// What the server reports for an account (GET /admin/auth/me). Mirrors the backend defaults.
const ALL = [
  "applications.read", "applications.review", "members.manage", "hiring.read", "profile_changes.review",
  "matching.manage", "reports.manage", "resources.manage", "community.manage", "broadcast.send",
  "safety.monitor", "donations.read", "notifications.manage", "skills.manage", "tutorials.manage", "admins.manage",
];
const SUPPORT = ["applications.read", "applications.review", "hiring.read", "profile_changes.review"];

const PAGES = [
  "/volunteer", "/learner", "/hiring", "/profile-changes", "/donations", "/notifications", "/accounts",
  "/list-of-values", "/reports", "/community", "/broadcast", "/safety", "/matching", "/tutorial-links", "/resources",
];

test("an account with every permission can open every portal page", () => {
  for (const path of PAGES) assert.equal(canAccessPath(path, ALL), true, path);
});

test("support defaults open the application queues and nothing else", () => {
  for (const path of ["/support", "/volunteer", "/learner", "/hiring", "/profile-changes", "/access-denied", "/volunteer/anything"]) {
    assert.equal(canAccessPath(path, SUPPORT), true, path);
  }
  for (const path of ["/donations", "/donations/x", "/notifications", "/accounts", "/list-of-values", "/reports", "/community", "/broadcast", "/safety", "/matching", "/tutorial-links", "/resources"]) {
    assert.equal(canAccessPath(path, SUPPORT), false, path);
  }
});

test("switching one area on opens exactly that page", () => {
  const withDonations = [...SUPPORT, "donations.read"];
  assert.equal(canAccessPath("/donations", withDonations), true);
  assert.equal(canAccessPath("/reports", withDonations), false);
  const withReports = [...SUPPORT, "reports.manage"];
  assert.equal(canAccessPath("/reports", withReports), true);
  assert.equal(canAccessPath("/donations", withReports), false);
});

test("switching an area off closes its page", () => {
  const noHiring = SUPPORT.filter((p) => p !== "hiring.read");
  assert.equal(canAccessPath("/hiring", noHiring), false);
  assert.equal(canAccessPath("/volunteer", noHiring), true);
});

test("every sidebar page maps to a permission the backend catalogue knows", () => {
  for (const path of PAGES) {
    const needed = requiredPermissionFor(path);
    assert.ok(needed && ALL.includes(needed), `${path} -> ${needed}`);
  }
});

test("a page nobody mapped yet is admin-only (closed by default)", () => {
  assert.equal(requiredPermissionFor("/some-new-page"), "admins.manage");
  assert.equal(canAccessPath("/some-new-page", SUPPORT), false);
  assert.equal(canAccessPath("/some-new-page", ALL), true);
});

test("prefix matching does not leak: /donations-archive is not /donations, /learners is not /learner", () => {
  assert.equal(requiredPermissionFor("/donations-archive"), "admins.manage");
  assert.equal(requiredPermissionFor("/learners"), "admins.manage");
});

test("the support dashboard and access-denied page are open to any signed-in account, even with nothing switched on", () => {
  assert.equal(canAccessPath("/support", []), true);
  assert.equal(canAccessPath("/access-denied", []), true);
  assert.equal(canAccessPath("/volunteer", []), false);
});

test("login only ever navigates to a known landing page", () => {
  assert.equal(safeHomePath("/volunteer", "admin"), "/volunteer");
  assert.equal(safeHomePath("/support", "support"), "/support");
  assert.equal(safeHomePath("https://evil.example/", "support"), "/support");
  assert.equal(safeHomePath("//evil.example", "admin"), "/volunteer");
  assert.equal(safeHomePath(undefined, "superuser"), "/access-denied");
});
