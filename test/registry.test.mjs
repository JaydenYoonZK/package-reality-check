import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAll, fetchFacts } from "../docs/registry.js";

// Stub global fetch so these tests are deterministic and offline.
function stubFetch(routes) {
  globalThis.fetch = async (url) => {
    for (const [pattern, handler] of routes) {
      if (url.includes(pattern)) {
        const { status = 200, body = {} } = handler(url);
        return {
          status, ok: status >= 200 && status < 300,
          json: async () => body
        };
      }
    }
    return { status: 404, ok: false, json: async () => ({ error: "Not found" }) };
  };
}

const NOW = Date.UTC(2026, 6, 8);

test("fetchFacts: existing npm package returns facts", async () => {
  stubFetch([
    ["registry.npmjs.org/express", () => ({ body: { "dist-tags": { latest: "4.18.0" }, time: { created: "2010-01-01T00:00:00Z" }, versions: { "4.18.0": {} } } })],
    ["api.npmjs.org/downloads", () => ({ body: { downloads: 9000000 } })],
  ]);
  const f = await fetchFacts({ name: "express", ecosystem: "npm" });
  assert.equal(f.exists, true);
  assert.equal(f.downloads, 9000000);
  assert.equal(f.deprecated, false);
});

test("fetchFacts: missing package with no cross-eco match is a pure phantom", async () => {
  stubFetch([]); // everything 404s
  const f = await fetchFacts({ name: "totally-made-up-xyz", ecosystem: "npm" });
  assert.equal(f.exists, false);
  assert.equal(f.foundIn, null);
});

test("fetchFacts: missing on npm but present on PyPI reports foundIn", async () => {
  stubFetch([
    ["pypi.org/pypi/flask", () => ({ body: { releases: { "3.0.0": [{ upload_time_iso_8601: "2023-09-30T00:00:00Z" }] } } })],
  ]);
  const f = await fetchFacts({ name: "flask", ecosystem: "npm" });
  assert.equal(f.exists, false);
  assert.equal(f.foundIn, "other");
});

test("fetchFacts: PyPI package earliest upload becomes createdAt", async () => {
  stubFetch([
    ["pypi.org/pypi/requests", () => ({ body: { releases: {
      "2.31.0": [{ upload_time_iso_8601: "2023-05-22T00:00:00Z" }],
      "2.0.0": [{ upload_time_iso_8601: "2013-09-24T00:00:00Z" }]
    } } })],
  ]);
  const f = await fetchFacts({ name: "requests", ecosystem: "pypi" });
  assert.equal(f.exists, true);
  assert.equal(f.createdAt, "2013-09-24T00:00:00Z");
});

test("fetchFacts: retries transient 500 then succeeds", async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    if (calls < 2) return { status: 503, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => ({ "dist-tags": { latest: "1.0.0" }, time: { created: "2020-01-01T00:00:00Z" }, versions: { "1.0.0": {} } }) };
  };
  const f = await fetchFacts({ name: "flaky", ecosystem: "npm" });
  assert.equal(f.exists, true);
  assert.ok(calls >= 2, "should have retried");
});

test("checkAll: returns verdicts in input order with a phantom flagged", async () => {
  stubFetch([
    ["registry.npmjs.org/react", () => ({ body: { "dist-tags": { latest: "18.2.0" }, time: { created: "2013-05-24T00:00:00Z" }, versions: { "18.2.0": {} } } })],
    ["api.npmjs.org/downloads", () => ({ body: { downloads: 20000000 } })],
    // made-up-pkg + its pypi cross-check both 404 via default
  ]);
  const deps = [{ name: "react", ecosystem: "npm" }, { name: "made-up-pkg-zzz", ecosystem: "npm" }];
  const out = await checkAll(deps, { now: NOW });
  assert.equal(out.length, 2);
  assert.equal(out[0].name, "react");
  assert.equal(out[0].level, "ok");
  assert.equal(out[1].name, "made-up-pkg-zzz");
  assert.equal(out[1].level, "phantom");
});

test("checkAll: surfaces a hard network failure as an error verdict, not a phantom", async () => {
  globalThis.fetch = async () => { throw new Error("ECONNRESET"); };
  const out = await checkAll([{ name: "x", ecosystem: "npm" }], { now: NOW });
  assert.equal(out[0].level, "error");
});
