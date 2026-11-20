// Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildQuery, withQuery } from "../../src/utils/query.ts";

test("values are percent-encoded so & # + cannot add or cut parameters", () => {
  assert.equal(buildQuery({ query: "R&D #1 a+b" }), "query=R%26D+%231+a%2Bb");
  const parsed = new URLSearchParams(buildQuery({ query: "x&admin=1", page: 2 }));
  assert.equal(parsed.get("query"), "x&admin=1");
  assert.equal(parsed.has("admin"), false);
  assert.equal(parsed.get("page"), "2");
});

test("empty, null and undefined values are dropped, zero and false are kept", () => {
  assert.equal(buildQuery({ a: "", b: null, c: undefined, d: 0, e: false, f: "x" }), "d=0&e=false&f=x");
});

test("withQuery adds a question mark only when there is something to send", () => {
  assert.equal(withQuery("admin/volunteer", {}), "admin/volunteer");
  assert.equal(withQuery("admin/volunteer", { a: "" }), "admin/volunteer");
  assert.equal(withQuery("admin/volunteer", { page: 1, size: 10 }), "admin/volunteer?page=1&size=10");
});
