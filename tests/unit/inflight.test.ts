// Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";

import { coalesceMutations, createInFlightGuard, mutationKey } from "../../src/utils/inflight.ts";

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

test("the guard refuses a second call while the first is running, then allows the next", async () => {
  const guard = createInFlightGuard();
  const gate = deferred<string>();
  let calls = 0;
  const first = guard.run(() => {
    calls++;
    return gate.promise;
  });
  assert.equal(guard.busy, true);
  assert.equal(
    await guard.run(() => {
      calls++;
      return "second";
    }),
    undefined
  );
  gate.resolve("done");
  assert.equal(await first, "done");
  assert.equal(calls, 1);
  assert.equal(guard.busy, false);
  assert.equal(await guard.run(() => "again"), "again");
});

test("the guard releases after a failure so the user can retry", async () => {
  const guard = createInFlightGuard();
  await assert.rejects(
    guard.run(async () => {
      throw new Error("boom");
    }),
    /boom/
  );
  assert.equal(guard.busy, false);
  assert.equal(await guard.run(() => "ok"), "ok");
});

test("a synchronous throw also releases the guard", async () => {
  const guard = createInFlightGuard();
  await assert.rejects(
    guard.run(() => {
      throw new Error("sync");
    }),
    /sync/
  );
  assert.equal(guard.busy, false);
});

test("mutationKey: reads and uploads are never coalesced", () => {
  assert.equal(mutationKey({ method: "GET", url: "admin/x" }), null);
  assert.equal(mutationKey({ url: "admin/x" }), null);
  assert.equal(mutationKey({ method: "post", url: "admin/upload", data: new FormData() }), null);
});

test("mutationKey: identical writes share a key, different bodies or URLs do not", () => {
  const a = mutationKey({ method: "POST", url: "admin/auth/create_credentials", data: { username: "jane", role: "support" } });
  assert.equal(a, mutationKey({ method: "post", url: "admin/auth/create_credentials", data: { username: "jane", role: "support" } }));
  assert.notEqual(a, mutationKey({ method: "POST", url: "admin/auth/create_credentials", data: { username: "joe", role: "support" } }));
  assert.notEqual(a, mutationKey({ method: "PUT", url: "admin/auth/create_credentials", data: { username: "jane", role: "support" } }));
});

test("coalesceMutations: a double-click sends one request and both callers get its answer", async () => {
  let sent = 0;
  const gate = deferred<string>();
  const send = coalesceMutations((_c: { method: string; url: string; data?: unknown }) => {
    sent++;
    return gate.promise;
  });
  const cfg = { method: "PUT", url: "admin/onboarding/update_verification_status/volunteer/1/verification_completed", data: {} };
  const p1 = send(cfg);
  const p2 = send({ ...cfg });
  gate.resolve("approved");
  assert.deepEqual(await Promise.all([p1, p2]), ["approved", "approved"]);
  assert.equal(sent, 1);

  // Once it has finished, the same request is allowed again.
  const send2 = coalesceMutations((_c: { method: string; url: string }) => {
    sent++;
    return Promise.resolve("x");
  });
  await send2({ method: "PUT", url: "a" });
  await send2({ method: "PUT", url: "a" });
  assert.equal(sent, 3);
});

test("coalesceMutations: reads are never shared, and a failed request is not cached", async () => {
  let sent = 0;
  const send = coalesceMutations((_c: { method: string; url: string }) => {
    sent++;
    return Promise.resolve(sent);
  });
  await Promise.all([send({ method: "GET", url: "x" }), send({ method: "GET", url: "x" })]);
  assert.equal(sent, 2);

  let attempts = 0;
  const flaky = coalesceMutations((_c: { method: string; url: string }) => {
    attempts++;
    return attempts === 1 ? Promise.reject(new Error("net")) : Promise.resolve("ok");
  });
  await assert.rejects(flaky({ method: "POST", url: "y" }), /net/);
  assert.equal(await flaky({ method: "POST", url: "y" }), "ok");
});
