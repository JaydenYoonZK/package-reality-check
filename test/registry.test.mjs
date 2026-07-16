import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { checkAll, fetchFacts } from "../docs/registry.js";

// Test isolation: every test here must mock fetch. Before each test, install a
// fetch that throws loudly, so a test that forgets to stub fails fast instead
// of silently hitting the real network (which would make the suite flaky and
// order-dependent). Restore the real fetch afterward so nothing leaks out.
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = () => { throw new Error("test made an un-mocked network call"); };
});
afterEach(() => { globalThis.fetch = realFetch; });

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

test("fetchFacts npm: an established package is decided WITHOUT the full document", async () => {
  // The full registry document can be many megabytes. For a well-downloaded
  // package we must answer from /latest + downloads alone and never fetch it.
  let fullFetched = false;
  globalThis.fetch = async (url) => {
    if (url.endsWith("/latest")) return { status: 200, ok: true, json: async () => ({ version: "5.0.0" }) };
    if (url.includes("api.npmjs.org/downloads")) return { status: 200, ok: true, json: async () => ({ downloads: 5_000_000 }) };
    fullFetched = true;
    return { status: 200, ok: true, json: async () => ({ time: { created: "2011-01-01T00:00:00Z" } }) };
  };
  const f = await fetchFacts({ name: "express", ecosystem: "npm" });
  assert.equal(f.exists, true);
  assert.equal(f.downloads, 5_000_000);
  assert.equal(fullFetched, false, "must not download the multi-MB full document for an established package");
});

test("fetchFacts npm: a low-download package still gets its creation date", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/latest")) return { status: 200, ok: true, json: async () => ({ version: "0.0.1" }) };
    if (url.includes("api.npmjs.org/downloads")) return { status: 200, ok: true, json: async () => ({ downloads: 3 }) };
    return { status: 200, ok: true, json: async () => ({ time: { created: "2026-06-01T00:00:00Z" }, "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } }) };
  };
  const f = await fetchFacts({ name: "tiny-fresh-pkg", ecosystem: "npm" });
  assert.equal(f.exists, true);
  assert.equal(f.downloads, 3);
  assert.equal(f.createdAt, "2026-06-01T00:00:00Z");
});

test("fetchFacts npm: a prerelease-only package (no latest tag) is not a phantom", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/latest")) return { status: 404, ok: false, json: async () => ({ error: "version not found" }) };
    if (url.includes("api.npmjs.org/downloads")) return { status: 404, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => ({ "dist-tags": { next: "1.0.0-beta.1" }, time: { created: "2026-05-01T00:00:00Z" }, versions: { "1.0.0-beta.1": {} } }) };
  };
  const f = await fetchFacts({ name: "beta-only-pkg", ecosystem: "npm" });
  assert.equal(f.exists, true, "exists even without a `latest` dist-tag");
  assert.equal(f.createdAt, "2026-05-01T00:00:00Z");
});

test("fetchFacts: an invalid package name is rejected without any network call", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { status: 404, ok: false, json: async () => ({}) }; };
  const f = await fetchFacts({ name: "../../-/npm/v1/security/x", ecosystem: "npm" });
  assert.equal(f.invalid, true);
  assert.equal(f.exists, false);
  assert.equal(calls, 0, "a hostile name must never reach the network");
});

test("fetchFacts npm: detects a security-holding placeholder from /latest", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/latest")) return { status: 200, ok: true, json: async () => ({ version: "0.0.1-security", description: "security holding package" }) };
    if (url.includes("api.npmjs.org/downloads")) return { status: 200, ok: true, json: async () => ({ downloads: 333 }) };
    return { status: 200, ok: true, json: async () => ({ time: { created: "2018-01-01T00:00:00Z" }, "dist-tags": { latest: "0.0.1-security" }, versions: {} }) };
  };
  const f = await fetchFacts({ name: "flatmap-stream", ecosystem: "npm" });
  assert.equal(f.exists, true);
  assert.equal(f.securityHolding, true);
});

test("fetchFacts npm: deprecation is read from the latest manifest", async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith("/latest")) return { status: 200, ok: true, json: async () => ({ version: "1.0.0", deprecated: "no longer maintained" }) };
    if (url.includes("api.npmjs.org/downloads")) return { status: 200, ok: true, json: async () => ({ downloads: 10_000_000 }) };
    throw new Error("full document should not be needed");
  };
  const f = await fetchFacts({ name: "old-pkg", ecosystem: "npm" });
  assert.equal(f.exists, true);
  assert.equal(f.deprecated, true);
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

test("fetchFacts npm: a non-404 error (403) is not treated as existence", async () => {
  // A 403 on /latest must not read as 'exists'. It falls through to the full
  // document, which also 403s, so the honest answer is an error, not a phantom
  // and definitely not a confident OK.
  globalThis.fetch = async () => ({ status: 403, ok: false, json: async () => ({}) });
  const f = await fetchFacts({ name: "blocked-name", ecosystem: "npm" });
  assert.notEqual(f.exists, true, "a 403 must never confirm existence");
  assert.match(f.error, /registry answered 403/);
});

test("fetchFacts pypi: a non-404 error (403) is an error verdict, not a phantom", async () => {
  globalThis.fetch = async () => ({ status: 403, ok: false, json: async () => ({}) });
  const f = await fetchFacts({ name: "some-pypi-pkg", ecosystem: "pypi" });
  assert.notEqual(f.exists, true);
  assert.match(f.error, /registry answered 403/);
});

test("fetchFacts pypi: a 404 is a phantom, and reports foundIn when the name is on npm", async () => {
  // pypi 404 for the package, but the cross-ecosystem npm check finds it.
  const requested = [];
  globalThis.fetch = async (url) => {
    requested.push(url);
    if (url.includes("pypi.org/pypi/left-pad")) {
      return { status: 404, ok: false, json: async () => ({ error: "Not found" }) };
    }
    if (url.endsWith("/left-pad/latest")) {
      return { status: 200, ok: true, json: async () => ({ name: "left-pad", version: "1.3.0" }) };
    }
    throw new Error(`unexpected request: ${url}`);
  };
  const found = await fetchFacts({ name: "left-pad", ecosystem: "pypi" });
  assert.equal(found.exists, false);
  assert.equal(found.foundIn, "other");
  assert.ok(requested.some(url => url.endsWith("/left-pad/latest")));
  assert.ok(!requested.some(url => url.endsWith("/left-pad")), "must not fetch npm's full package document");

  // pypi 404 and nowhere else either -> a pure phantom.
  stubFetch([]);
  const pure = await fetchFacts({ name: "totally-made-up-pypi-zzz", ecosystem: "pypi" });
  assert.equal(pure.exists, false);
  assert.equal(pure.foundIn, null);
});

test("a 200 response with an unreadable body reports 'unreadable', not 'answered 200'", async () => {
  // A CDN error page or truncated response: HTTP 200 but the body fails to parse.
  globalThis.fetch = async (url) => ({
    status: 200,
    ok: true,
    json: async () => { throw new SyntaxError("Unexpected token < in JSON"); }
  });
  const npm = await fetchFacts({ name: "some-npm-name", ecosystem: "npm" });
  const pypi = await fetchFacts({ name: "some-pypi-name", ecosystem: "pypi" });
  for (const f of [npm, pypi]) {
    assert.equal(f.error, "registry returned an unreadable response");
    assert.doesNotMatch(f.error, /answered 200/);
  }
});
