import test from "node:test";
import assert from "node:assert/strict";
import { reportedUserHref } from "../../src/utils/reportLinks.ts";

test("a reported volunteer links to the volunteer record, a learner to the learner record", () => {
  assert.equal(reportedUserHref({ reportedUserId: "v1", reportedUserRole: "volunteer" }), "/volunteer?volunteer_id=v1");
  assert.equal(reportedUserHref({ reportedUserId: "l1", reportedUserRole: "learner" }), "/learner?learner_id=l1");
});

test("no link when the person or their role is unknown", () => {
  assert.equal(reportedUserHref(undefined), null);
  assert.equal(reportedUserHref({ reportedUserRole: "learner" }), null);
  assert.equal(reportedUserHref({ reportedUserId: "x" }), null);
});

test("the id is URL-encoded", () => {
  assert.equal(reportedUserHref({ reportedUserId: "a b&c", reportedUserRole: "learner" }), "/learner?learner_id=a%20b%26c");
});
