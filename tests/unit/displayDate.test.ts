import test from "node:test";
import assert from "node:assert/strict";
import { formatDisplayDateTime } from "../../src/utils/displayDateTime.ts";

test("the date-time format matches the console's date style and adds the time", () => {
  assert.equal(formatDisplayDateTime("2026-10-29T15:15:38"), "29 Oct 2026, 3:15 PM");
  assert.equal(formatDisplayDateTime("2026-10-29T09:05:00"), "29 Oct 2026, 9:05 AM");
});

test("missing or unparseable values show a dash, not 'Invalid Date'", () => {
  assert.equal(formatDisplayDateTime(undefined), "-");
  assert.equal(formatDisplayDateTime(null), "-");
  assert.equal(formatDisplayDateTime(""), "-");
  assert.equal(formatDisplayDateTime("not a date"), "-");
});
