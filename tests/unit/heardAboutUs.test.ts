import assert from "node:assert/strict";
import { test } from "node:test";

import { formatHeardAboutUs } from "../../src/utils/heardAboutUs.ts";

test("shows the chosen option", () => {
  assert.equal(formatHeardAboutUs({ heard_about_us: "Handshake" }), "Handshake");
});

test("'Other' shows what the person wrote", () => {
  assert.equal(formatHeardAboutUs({ heard_about_us: "Other", heard_about_us_other: " a podcast " }), "Other: a podcast");
  assert.equal(formatHeardAboutUs({ heard_about_us: "Other", heard_about_us_other: "  " }), "Other");
});

test("older applications without the answer show a dash", () => {
  assert.equal(formatHeardAboutUs({}), "-");
  assert.equal(formatHeardAboutUs(null), "-");
  assert.equal(formatHeardAboutUs(undefined), "-");
});
