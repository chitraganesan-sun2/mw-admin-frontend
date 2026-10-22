// Run with: npm run test:unit   (Node's built-in test runner; no extra dependencies)
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ROLE_PERMISSIONS_UX,
  canAccessPath,
  requiredPermissionFor,
  safeHomePath,
} from "../../src/constants/access.ts";

const admin = ROLE_PERMISSIONS_UX.admin;
const support = ROLE_PERMISSIONS_UX.support;

test("admin can open every portal page", () => {
  for (const path of ["/volunteer", "/learner", "/hiring", "/profile-changes", "/donations", "/notifications", "/list-of-values", "/reports", "/community", "/broadcast", "/safety", "/matching", "/tutorial-links", "/resources"]) {
    assert.equal(canAccessPath(path, admin), true, path);
  }
});

test("support can open the application queues and nothing else", () => {
  for (const path of ["/support", "/volunteer", "/learner", "/hiring", "/profile-changes", "/access-denied", "/volunteer/anything"]) {
    assert.equal(canAccessPath(path, support), true, path);
  }
  for (const path of ["/donations", "/donations/x", "/notifications", "/list-of-values", "/reports", "/community", "/broadcast", "/safety", "/matching", "/tutorial-links", "/resources"]) {
    assert.equal(canAccessPath(path, support), false, path);
  }
});

test("a page nobody mapped yet is admin-only (closed by default)", () => {
  assert.equal(requiredPermissionFor("/some-new-page"), "admins.manage");
  assert.equal(canAccessPath("/some-new-page", support), false);
  assert.equal(canAccessPath("/some-new-page", admin), true);
});

test("prefix matching does not leak: /donations-archive is not /donations, /learners is not /learner", () => {
  assert.equal(requiredPermissionFor("/donations-archive"), "admins.manage");
  assert.equal(requiredPermissionFor("/learners"), "admins.manage");
});

test("an account with no permissions can only see the access-denied page", () => {
  assert.equal(canAccessPath("/access-denied", []), true);
  assert.equal(canAccessPath("/volunteer", []), false);
});

test("login only ever navigates to a known landing page", () => {
  assert.equal(safeHomePath("/volunteer", "admin"), "/volunteer");
  assert.equal(safeHomePath("/support", "support"), "/support");
  // a server value outside the known set is ignored in favour of the role's own home
  assert.equal(safeHomePath("https://evil.example/", "support"), "/support");
  assert.equal(safeHomePath("//evil.example", "admin"), "/volunteer");
  // an unknown role gets the access-denied page, not a guess
  assert.equal(safeHomePath(undefined, "superuser"), "/access-denied");
});
