import assert from "node:assert/strict";
import { test } from "node:test";

import { publishBlocked, safetyState } from "../../src/utils/wingtime.ts";

const base = { transcript_status: "submitted", safety_report_id: 5 } as const;

test("a completed clean analysis can be published", () => {
  const s = safetyState({ ...base, safety: { status: "COMPLETED", severity: "low" } } as never);
  assert.equal(publishBlocked(s, false), false);
});

test("a flagged analysis needs the admin's explicit OK", () => {
  const s = safetyState({ ...base, safety: { status: "COMPLETED", severity: "high" } } as never);
  assert.equal(publishBlocked(s, false), true);
  assert.equal(publishBlocked(s, true), false);
});

test("nothing was checked: no transcript, still running or failed all block, and ticking the box does not unblock", () => {
  const none = safetyState({ transcript_status: "empty", safety_report_id: null, safety: null } as never);
  const waiting = safetyState({ transcript_status: "requested", safety_report_id: null, safety: null } as never);
  const failed = safetyState({ ...base, safety: { status: "FAILED", severity: null } } as never);
  for (const s of [none, waiting, failed]) {
    assert.equal(publishBlocked(s, false), true, s.kind);
    assert.equal(publishBlocked(s, true), true, s.kind);
  }
  assert.equal(publishBlocked(null, true), true);
});
