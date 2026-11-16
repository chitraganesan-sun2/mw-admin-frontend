import assert from "node:assert/strict";
import { test } from "node:test";

import { describeAction, metadataLines, shortId } from "../../src/utils/auditLog.ts";
import { percentOfAnswered } from "../../src/utils/feedbackSummary.ts";

test("audit action slugs read as sentences", () => {
  assert.equal(describeAction("learner.delete"), "Learner deleted");
  assert.equal(describeAction("mail.send"), "Mail sent");
  assert.equal(describeAction("list_of_values.restore_item"), "List Of Values restore item");
  assert.equal(describeAction("wingtime_recording.reject"), "Wingtime Recording rejected");
  assert.equal(describeAction("wingtime_recording.unpublish"), "Wingtime Recording unpublished");
  assert.equal(describeAction("export"), "Export");
  assert.equal(describeAction(""), "-");
});

test("ids and metadata are shortened for display", () => {
  assert.equal(shortId("abcdef0123456789"), "abcdef01");
  assert.equal(shortId(null), "-");
  assert.deepEqual(metadataLines({ count: 3, filters: { a: 1 } }), ["count: 3", 'filters: {"a":1}']);
  assert.deepEqual(metadataLines(undefined), []);
});

test("feedback percentages ignore unanswered and never divide by zero", () => {
  assert.equal(percentOfAnswered(3, { yes: 3, no: 1, unanswered: 50 }), 75);
  assert.equal(percentOfAnswered(0, { yes: 0, no: 0, unanswered: 9 }), null);
});
