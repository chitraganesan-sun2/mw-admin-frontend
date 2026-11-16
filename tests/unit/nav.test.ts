import assert from "node:assert/strict";
import { test } from "node:test";

import { NAV_GROUPS, findNavItem, flattenNav, searchNav, visibleNavGroups } from "../../src/config/nav.ts";
import { canAccessPath } from "../../src/constants/access.ts";

const ALL = [
  "applications.read", "applications.review", "members.manage", "hiring.read", "profile_changes.review",
  "matching.manage", "reports.manage", "resources.manage", "community.manage", "broadcast.send",
  "safety.monitor", "donations.read", "notifications.manage", "skills.manage", "tutorials.manage", "admins.manage",
];
const SUPPORT = ["applications.read", "applications.review", "hiring.read", "profile_changes.review"];

const hrefs = (groups: ReturnType<typeof visibleNavGroups>) => groups.flatMap((g) => g.items.map((i) => i.href));

test("every nav link is unique and reachable by an account with every permission", () => {
  const all = hrefs(visibleNavGroups({ permissions: ALL, role: "admin", wingtimeEnabled: true }));
  assert.equal(new Set(all).size, all.length);
  for (const g of NAV_GROUPS) for (const i of g.items) {
    if (i.role) continue; // role-only home pages
    assert.ok(canAccessPath(i.href, ALL), i.href);
    assert.ok(all.includes(i.href), `${i.href} should be listed for an admin`);
  }
});

test("a support account sees only its pages, plus the Support home, and no empty headings", () => {
  const groups = visibleNavGroups({ permissions: SUPPORT, role: "support", wingtimeEnabled: true });
  const list = hrefs(groups);
  assert.ok(list.includes("/support"));
  assert.ok(list.includes("/volunteer"));
  assert.ok(!list.includes("/accounts"));
  assert.ok(!list.includes("/audit-log"));
  assert.ok(!list.includes("/session-feedback"));
  assert.ok(groups.every((g) => g.items.length > 0));
});

test("the Support home is hidden from admins, and WingTime follows its flag", () => {
  const admin = hrefs(visibleNavGroups({ permissions: ALL, role: "admin", wingtimeEnabled: false }));
  assert.ok(!admin.includes("/support"));
  assert.ok(!admin.includes("/wingtime"));
});

test("quick-jump ranks name matches above keyword matches", () => {
  const flat = flattenNav(visibleNavGroups({ permissions: ALL, role: "admin", wingtimeEnabled: true }));
  assert.equal(searchNav(flat, "vol")[0].href, "/volunteer");
  assert.equal(searchNav(flat, "who did")[0].href, "/audit-log");
  assert.equal(searchNav(flat, "zzzz").length, 0);
  assert.equal(searchNav(flat, "").length, flat.length);
});

test("a nested path resolves to its nav item", () => {
  assert.equal(findNavItem("/safety/report/abc")?.item.href, "/safety");
  assert.equal(findNavItem("/nope"), null);
});
