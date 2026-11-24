import test from "node:test";
import assert from "node:assert/strict";
import { skippedRowsFromHeaders, skippedRowsMessage } from "../../src/utils/exportSkipped.ts";

test("reads the skipped-row count from plain, lower-cased or Headers-style bags", () => {
  assert.equal(skippedRowsFromHeaders({ "x-export-skipped-rows": "3" }), 3);
  assert.equal(skippedRowsFromHeaders({ "X-Export-Skipped-Rows": 2 }), 2);
  assert.equal(skippedRowsFromHeaders(new Headers({ "X-Export-Skipped-Rows": "5" })), 5);
});

test("absent, zero or malformed header means nothing to warn about", () => {
  assert.equal(skippedRowsFromHeaders(undefined), 0);
  assert.equal(skippedRowsFromHeaders({}), 0);
  assert.equal(skippedRowsFromHeaders({ "x-export-skipped-rows": "0" }), 0);
  assert.equal(skippedRowsFromHeaders({ "x-export-skipped-rows": "abc" }), 0);
});

test("message states how many rows were skipped", () => {
  assert.match(skippedRowsMessage(1), /1 record couldn't be read and was left out/);
  assert.match(skippedRowsMessage(4), /4 records couldn't be read and were left out/);
});
