import test from "node:test";
import assert from "node:assert/strict";
import { sessionStatusDisplay, sessionStatusKey } from "../../src/utils/sessionStatus.ts";

const NOW = Date.UTC(2026, 10, 24, 12, 0, 0);

test("accepted reads Accepted, rejected reads Declined (member-app vocabulary)", () => {
  assert.equal(sessionStatusDisplay({ status: "accepted" }, NOW).label, "Accepted");
  assert.equal(sessionStatusDisplay({ status: "rejected" }, NOW).label, "Declined");
  assert.equal(sessionStatusDisplay({ status: "completed" }, NOW).label, "Completed");
});

test("a pending request whose time has passed is Expired; a future one stays Pending", () => {
  const past = { status: "pending", start_utc: "2026-11-24T09:00:00", end_utc: "2026-11-24T10:00:00" };
  const future = { status: "pending", start_utc: "2026-11-24T15:00:00", end_utc: "2026-11-24T16:00:00+00:00" };
  assert.equal(sessionStatusKey(past, NOW), "expired");
  assert.equal(sessionStatusKey(future, NOW), "pending");
  assert.equal(sessionStatusKey({ status: "pending" }, NOW), "pending");
});

test("unknown statuses fall through unchanged", () => {
  assert.deepEqual(sessionStatusDisplay({ status: "weird" }, NOW), { label: "weird", color: "default" });
});
