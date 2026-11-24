import test from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, meetsAA, parseHex } from "../../src/utils/contrast.ts";
import { BRAND, BRAND_INK, BRAND_TINT, INK, INK_2, INK_3, ON_BRAND, SURFACE, CANVAS, TONES } from "../../src/theme/tokens.ts";

test("contrast maths matches the known reference values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
  // White on the brand cyan is the combination the audit flagged (2.27:1).
  assert.ok(Math.abs(contrastRatio("#FFFFFF", BRAND) - 2.27) < 0.02);
  assert.equal(parseHex("#09f")?.join(","), "0,153,255");
  assert.equal(parseHex("nope"), null);
});

test("text on the brand cyan fill is dark, not white", () => {
  assert.ok(meetsAA(ON_BRAND, BRAND), "dark ink on cyan");
  assert.ok(!meetsAA("#FFFFFF", BRAND), "white on cyan must stay rejected");
});

test("brand-coloured text is AA on white, the canvas and the cyan tint", () => {
  for (const bg of [SURFACE, CANVAS, BRAND_TINT]) {
    assert.ok(contrastRatio(BRAND_INK, bg) >= 4.5, `brand ink on ${bg}`);
  }
});

test("neutral text tokens are AA on white and on the canvas", () => {
  for (const fg of [INK, INK_2, INK_3]) {
    for (const bg of [SURFACE, CANVAS]) assert.ok(contrastRatio(fg, bg) >= 4.5, `${fg} on ${bg}`);
  }
});

test("every status tone pair is AA (>= 4.5:1)", () => {
  for (const [name, t] of Object.entries(TONES)) {
    assert.ok(contrastRatio(t.fg, t.bg) >= 4.5, `${name}: ${t.fg} on ${t.bg} = ${contrastRatio(t.fg, t.bg).toFixed(2)}`);
    assert.ok(contrastRatio(t.fg, SURFACE) >= 4.5, `${name} text on white`);
  }
});
