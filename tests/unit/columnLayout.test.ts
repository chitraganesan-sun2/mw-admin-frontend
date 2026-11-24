import test from "node:test";
import assert from "node:assert/strict";
import { columnPixelWidth, resolveColumns } from "../../src/components/Table/columnLayout.ts";

test("column width comes from the width prop, then a w-[Npx] class", () => {
  assert.equal(columnPixelWidth({ width: 140 }), 140);
  assert.equal(columnPixelWidth({ width: "96px" }), 96);
  assert.equal(columnPixelWidth({ className: "p-6 text-sm w-[220px] text-gray-900" }), 220);
  assert.equal(columnPixelWidth({ className: "!p-0 !w-[160px]" }), 160);
  assert.equal(columnPixelWidth({ width: 50, className: "w-[999px]" }), 50, "the prop wins over the class");
});

test("percent, auto and missing widths are not pixel widths", () => {
  assert.equal(columnPixelWidth({ width: "20%" }), undefined);
  assert.equal(columnPixelWidth({ className: "!w-[20%]" }), undefined);
  assert.equal(columnPixelWidth({ className: "min-w-[100px]" }), undefined);
  assert.equal(columnPixelWidth({}), undefined);
});

test("fixed layout needs every column sized, and the total adds up", () => {
  const ok = resolveColumns([{ width: 100 }, { className: "w-[200px]" }, { width: 80 }]);
  assert.equal(ok.fixedLayout, true);
  assert.equal(ok.totalWidth, 380);
  assert.deepEqual(ok.columns.map((c) => c.width), [100, 200, 80]);

  const partial = resolveColumns([{ width: 100 }, {}]);
  assert.equal(partial.fixedLayout, false);
  assert.equal(partial.totalWidth, 0);
});

test("extra width (selection / expand columns) counts toward the total", () => {
  assert.equal(resolveColumns([{ width: 100 }], 48).totalWidth, 148);
});

test("empty input is not fixed", () => {
  assert.equal(resolveColumns([]).fixedLayout, false);
  assert.equal(resolveColumns(undefined).fixedLayout, false);
});
