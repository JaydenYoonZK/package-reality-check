/**
 * Registry lookups for Package Reality Check.
 *
 * Turns a dependency into the facts verdict() needs, by querying npm and
 * PyPI directly. Used by both the browser app and the CLI, so it depends
 * only on the global fetch (Node 18+ and every modern browser). No
 * third-party packages: a supply-chain tool must not be a supply-chain
 * risk itself.
 */

import { registryUrls, verdict } from "./checker.js";

const UA = "package-reality-check (+https://github.com/JaydenYoonZK/package-reality-check)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GET a JSON URL with a timeout and bounded retries. A 404 is a definitive
 * answer and returns immediately; transient failures (network errors,
 * timeouts, 5xx, 429) are retried with backoff so a real package is never
 * mislabeled because of one dropped request.
 */
async function getJson(url, { timeoutMs = 12000, retries = 3 } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(250 * attempt);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA }, signal: ctrl.signal });
      if (res.status === 404) return { status: 404, ok: false, json: await res.json().catch(() => null) };
      if (res.status === 429 || res.status >= 500) { lastErr = new Error(`registry answered ${res.status}`); continue; }
      return { status: res.status, ok: res.ok, json: await res.json().catch(() => null) };
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error("request failed");
}

/** Does this name exist in the other ecosystem? Guards against wrong-ecosystem false phantoms. */
async function existsInOther(name, ecosystem) {
  const other = ecosystem === "npm" ? "pypi" : "npm";
  try {
    const r = await getJson(registryUrls(name, other).api);
    if (r.status === 404 || !r.ok) return false;
    return !(r.json && r.json.error);
  } catch { return false; }
}

/** Fetch registry facts for a dependency: { exists, createdAt?, downloads?, deprecated?, foundIn?, error? }. */
export async function fetchFacts(dep) {
  const urls = registryUrls(dep.name, dep.ecosystem);
  try {
    const r = await getJson(urls.api);
    if (r.status === 404 || (r.json && r.json.error)) {
      return { exists: false, foundIn: (await existsInOther(dep.name, dep.ecosystem)) ? "other" : null };
    }
    if (!r.ok || !r.json) return { error: `registry answered ${r.status}` };
    const data = r.json;

    if (dep.ecosystem === "npm") {
      const createdAt = data.time?.created ?? null;
      const latest = data["dist-tags"]?.latest;
      const deprecated = Boolean(latest && data.versions?.[latest]?.deprecated);
      let downloads = null;
      try {
        const d = await getJson(urls.downloads);
        if (d.ok && d.json) downloads = d.json.downloads ?? null;
      } catch { /* downloads optional */ }
      return { exists: true, createdAt, downloads, deprecated };
    }

    // PyPI: earliest upload across all releases.
    let earliest = null;
    for (const files of Object.values(data.releases ?? {})) {
      for (const f of files) {
        const t = f.upload_time_iso_8601 || f.upload_time;
        if (t && (!earliest || t < earliest)) earliest = t;
      }
    }
    return { exists: true, createdAt: earliest, downloads: null, deprecated: false };
  } catch (e) {
    return { error: e.name === "AbortError" ? "request timed out" : "network error" };
  }
}

/**
 * Check a list of deps with bounded concurrency. Returns verdicts in input
 * order. onProgress(done, total) is called after each completion.
 */
export async function checkAll(deps, { concurrency = 6, now = Date.now(), onProgress } = {}) {
  const out = new Array(deps.length);
  let done = 0;
  const queue = deps.map((dep, i) => ({ dep, i }));
  async function worker() {
    while (queue.length) {
      const { dep, i } = queue.shift();
      const facts = await fetchFacts(dep);
      out[i] = facts.error
        ? { ...dep, level: "error", title: "Could not check", detail: facts.error + ". Try again." }
        : { ...dep, ...verdict(dep.name, dep.ecosystem, facts, now) };
      done++;
      if (onProgress) onProgress(done, deps.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, deps.length || 1) }, worker));
  return out;
}
