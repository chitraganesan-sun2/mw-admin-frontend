// Set before any Date is created so the formatting below is deterministic wherever the tests run.
process.env.TZ = "Asia/Kolkata";

import test from "node:test";
import assert from "node:assert/strict";
import { formatDisplayDateTime, parseServerDate, serverTimeMs } from "../../src/utils/displayDateTime.ts";

test("zone-less backend timestamps are UTC and shown in the viewer's local zone (STA-7)", () => {
  // 15:15 UTC = 20:45 IST
  assert.equal(formatDisplayDateTime("2026-10-29T15:15:38"), "29 Oct 2026, 8:45 PM");
  assert.equal(formatDisplayDateTime("2026-10-29 15:15:38"), "29 Oct 2026, 8:45 PM");
  // Python's str(datetime.utcnow()) microseconds
  assert.equal(formatDisplayDateTime("2026-11-24T05:02:33.062510"), "24 Nov 2026, 10:32 AM");
  // the audit-report case: 20:30 UTC on 23 Nov is already 24 Nov in IST
  assert.equal(formatDisplayDateTime("2026-11-23T20:30:00"), "24 Nov 2026, 2:00 AM");
});

test("offset-aware strings still mean the same instant", () => {
  assert.equal(formatDisplayDateTime("2026-11-23T20:30:00+00:00"), "24 Nov 2026, 2:00 AM");
  assert.equal(formatDisplayDateTime("2026-11-23T20:30:00Z"), "24 Nov 2026, 2:00 AM");
  assert.equal(formatDisplayDateTime("2026-11-24T02:00:00+05:30"), "24 Nov 2026, 2:00 AM");
  // naive and aware spellings of one instant agree
  assert.equal(serverTimeMs("2026-11-23T20:30:00"), serverTimeMs("2026-11-23T20:30:00+00:00"));
});

test("numbers and Dates are taken as they are; date-only strings stay calendar dates", () => {
  assert.equal(formatDisplayDateTime(Date.UTC(2026, 10, 23, 20, 30)), "24 Nov 2026, 2:00 AM");
  assert.equal(formatDisplayDateTime(new Date(Date.UTC(2026, 10, 23, 20, 30))), "24 Nov 2026, 2:00 AM");
  assert.equal(parseServerDate("2026-11-24")?.getDate(), 24);
});

test("missing or unparseable values show a dash, not 'Invalid Date'", () => {
  assert.equal(formatDisplayDateTime(undefined), "-");
  assert.equal(formatDisplayDateTime(null), "-");
  assert.equal(formatDisplayDateTime(""), "-");
  assert.equal(formatDisplayDateTime("not a date"), "-");
  assert.ok(Number.isNaN(serverTimeMs("not a date")));
});
