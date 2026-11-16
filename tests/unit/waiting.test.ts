import assert from "node:assert/strict";
import { test } from "node:test";

import { waitingSince } from "../../src/utils/waiting.ts";

const NOW = Date.UTC(2026, 10, 16, 12, 0, 0);
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000 - 60 * 1000).toISOString();

test("age is counted in whole days and escalates at 2 and 5 days", () => {
  assert.deepEqual(waitingSince(daysAgo(0), NOW), { days: 0, text: "Today", level: "fresh" });
  assert.deepEqual(waitingSince(daysAgo(1), NOW), { days: 1, text: "1 day", level: "fresh" });
  assert.equal(waitingSince(daysAgo(2), NOW)?.level, "aging");
  assert.equal(waitingSince(daysAgo(4), NOW)?.level, "aging");
  assert.deepEqual(waitingSince(daysAgo(5), NOW), { days: 5, text: "5 days", level: "overdue" });
});

test("missing, unreadable or future dates never crash or go negative", () => {
  assert.equal(waitingSince(null, NOW), null);
  assert.equal(waitingSince("not a date", NOW), null);
  assert.equal(waitingSince(new Date(NOW + 3 * 24 * 60 * 60 * 1000), NOW)?.days, 0);
});
