// Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";

import { isHttpUrl, safeHref } from "../../src/utils/safeHref.ts";

test("isHttpUrl accepts only absolute http(s) URLs", () => {
  assert.equal(isHttpUrl("https://example.org/watch?v=1"), true);
  assert.equal(isHttpUrl("http://example.org"), true);
  assert.equal(isHttpUrl("  https://example.org  "), true);
  for (const bad of ["ftp://example.org/file", "javascript:alert(1)", "data:text/html,x", "mailto:a@b.org", "example.org", "//example.org", "https://", "", "  ", null, undefined, 42]) {
    assert.equal(isHttpUrl(bad), false, String(bad));
  }
});

test("safeHref still refuses script-like schemes", () => {
  assert.equal(safeHref("javascript:alert(1)"), undefined);
  assert.equal(safeHref("https://example.org"), "https://example.org/");
});
