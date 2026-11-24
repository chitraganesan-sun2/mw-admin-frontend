import test from "node:test";
import assert from "node:assert/strict";
import { toneFromColor, toneFromStatus } from "../../src/utils/statusTone.ts";
import { SESSION_STATUS_LABEL } from "../../src/utils/sessionStatus.ts";

test("antd preset colours map onto the five tones", () => {
  assert.equal(toneFromColor("green"), "success");
  assert.equal(toneFromColor("gold"), "warning");
  assert.equal(toneFromColor("orange"), "warning");
  assert.equal(toneFromColor("red"), "danger");
  assert.equal(toneFromColor("blue"), "info");
  assert.equal(toneFromColor("purple"), "info");
  assert.equal(toneFromColor("default"), "neutral");
  assert.equal(toneFromColor(undefined), "neutral");
  assert.equal(toneFromColor("not-a-colour"), "neutral");
  assert.equal(toneFromColor("GREEN"), "success", "case-insensitive");
});

test("domain statuses map to a tone and unknown ones are neutral", () => {
  assert.equal(toneFromStatus("verification_completed"), "success");
  assert.equal(toneFromStatus("Verification Pending"), "warning");
  assert.equal(toneFromStatus("verification_rejected"), "danger");
  assert.equal(toneFromStatus("details_pending"), "info");
  assert.equal(toneFromStatus("resolved"), "success");
  assert.equal(toneFromStatus("something-new"), "neutral");
  assert.equal(toneFromStatus(null), "neutral");
});

test("every session status colour still resolves to a real tone", () => {
  const tones = new Set(["success", "warning", "danger", "info", "neutral"]);
  for (const [key, meta] of Object.entries(SESSION_STATUS_LABEL)) {
    assert.ok(tones.has(toneFromColor(meta.color)), `${key} -> ${meta.color}`);
  }
  assert.equal(toneFromColor(SESSION_STATUS_LABEL.pending.color), "warning");
  assert.equal(toneFromColor(SESSION_STATUS_LABEL.accepted.color), "success");
  assert.equal(toneFromColor(SESSION_STATUS_LABEL.rejected.color), "danger");
});
