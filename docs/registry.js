/*! Package Reality Check | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/package-reality-check */
/**
 * Registry lookups for Package Reality Check.
 *
 * Turns a dependency into the facts verdict() needs, by querying npm and
 * PyPI directly. Used by both the browser app and the CLI, so it depends
 * only on the global fetch (Node 18+ and every modern browser). No
 * third-party packages: a supply-chain tool must not be a supply-chain
 * risk itself.
 */

import { registryUrls, verdict, isValidPackageName, ESTABLISHED_DOWNLOADS } from "./checker.js";

const UA = "package-reality-check (+https://github.com/JaydenYoonZK/package-reality-check)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GET a JSON URL with a timeout and bounded retries. A 404 is a definitive
 * answer and returns immediately; transient failures (network errors,
 * timeouts, 5xx, 429) are retried with backoff so a real package is never
 * mislabeled because of one dropped request.
 */
async function getJson(url, { timeoutMs = 20000, retries = 3 } = {}) {
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

// A response we could not use. A 2xx status with an unreadable body (a CDN
// error page, a truncated response) is reported as unreadable rather than
// "registry answered 200", which reads as a contradiction.
function describeFetchError(res) {
  if (res.ok && !res.json) return "registry returned an unreadable response";
  return `registry answered ${res.status}`;
}

/** Does this name exist in the other ecosystem? Guards against wrong-ecosystem false phantoms. */
async function existsInOther(name, ecosystem) {
  const other = ecosystem === "npm" ? "pypi" : "npm";
  // A scoped npm name (@scope/pkg) cannot exist on PyPI; skip the request.
  if (other === "pypi" && name.startsWith("@")) return false;
  // npm names are lowercase, so a PyPI-style name must be lowercased to get
  // an honest answer (Flask_SQLAlchemy would otherwise always miss).
  const lookup = other === "npm" ? name.toLowerCase() : name;
  try {
    const urls = registryUrls(lookup, other);
    // npm's full package document may be many megabytes. Existence in the
    // other registry needs only the small latest manifest.
    const r = await getJson(other === "npm" ? urls.latest : urls.api);
    if (r.status === 404 || !r.ok) return false;
    return !(r.json && r.json.error);
  } catch { return false; }
}

/** Fetch registry facts for a dependency: { exists, createdAt?, downloads?, deprecated?, foundIn?, error? }. */
export async function fetchFacts(dep) {
  // Reject names that are not real package names (paths, URLs, injection)
  // before building any URL or touching the network.
  if (!isValidPackageName(dep.name, dep.ecosystem)) return { exists: false, invalid: true };
  const urls = registryUrls(dep.name, dep.ecosystem);
  try {
    return dep.ecosystem === "npm" ? await fetchNpmFacts(dep, urls) : await fetchPypiFacts(dep, urls);
  } catch (e) {
    return { error: e.name === "AbortError" ? "request timed out" : "network error" };
  }
}

/**
 * npm facts, fetched cheaply. The full registry document for a package with a
 * long history can be many megabytes (@types/node is ~11 MB), which is slow
 * and wasteful when all we need is existence, downloads, deprecation, and a
 * creation date. So:
 *   1. existence + deprecation come from the tiny /latest manifest,
 *   2. the monthly download count (which the API serves for scoped names too)
 *      tells us whether the package is already established,
 *   3. the large full document is fetched only when we still need a creation
 *      date, i.e. for packages that are NOT established by downloads. Those are
 *      exactly the small, new, or obscure packages whose full document is tiny.
 * A phantom is decided without ever paying for a big download.
 */
async function fetchNpmFacts(dep, urls) {
  const latest = await getJson(urls.latest);
  // Only a successful response confirms existence. A non-404 error (403, 400,
  // a proxy error page) is NOT proof the package exists, so fall through to the
  // authoritative full-document check rather than trusting it.
  let exists = Boolean(latest.ok && latest.json && !latest.json.error);
  let deprecated = Boolean(exists && latest.json.deprecated);
  // npm replaces removed/hijacked packages with a stub published as
  // "x.y.z-security" and described "security holding package". Detect it here,
  // from the same tiny manifest, so it never reads as a mere low-download warn.
  let securityHolding = false;
  if (exists) {
    const v = String(latest.json.version || "");
    const desc = String(latest.json.description || "").toLowerCase();
    securityHolding = /-security$/.test(v) || desc === "security holding package";
  }

  let downloads = null;
  try {
    const d = await getJson(urls.downloads);
    if (d.ok && d.json) downloads = d.json.downloads ?? null;
  } catch { /* downloads optional */ }
  const establishedByDownloads = typeof downloads === "number" && downloads >= ESTABLISHED_DOWNLOADS;

  // Fetch the full document only when it can change the answer: to confirm a
  // package that has no `latest` dist-tag (prerelease-only), or to read the
  // creation date for a package we cannot yet call established.
  let createdAt = null;
  if (!exists || !establishedByDownloads) {
    const full = await getJson(urls.api);
    if (full.status === 404 || (full.json && full.json.error)) {
      if (!exists) return { exists: false, foundIn: (await existsInOther(dep.name, dep.ecosystem)) ? "other" : null };
    } else if (full.ok && full.json) {
      exists = true;
      createdAt = full.json.time?.created ?? null;
      const lt = full.json["dist-tags"]?.latest;
      if (lt && full.json.versions?.[lt]?.deprecated) deprecated = true;
    } else if (!exists) {
      return { error: describeFetchError(full) };
    }
  }

  if (!exists) return { exists: false, foundIn: (await existsInOther(dep.name, dep.ecosystem)) ? "other" : null };
  return { exists: true, createdAt, downloads, deprecated, securityHolding };
}

/** PyPI facts: existence and the earliest upload across all releases (its age). */
async function fetchPypiFacts(dep, urls) {
  const r = await getJson(urls.api);
  if (r.status === 404 || (r.json && r.json.error)) {
    return { exists: false, foundIn: (await existsInOther(dep.name, dep.ecosystem)) ? "other" : null };
  }
  if (!r.ok || !r.json) return { error: describeFetchError(r) };

  let earliest = null;
  for (const files of Object.values(r.json.releases ?? {})) {
    for (const f of files) {
      const t = f.upload_time_iso_8601 || f.upload_time;
      if (t && (!earliest || t < earliest)) earliest = t;
    }
  }
  return { exists: true, createdAt: earliest, downloads: null, deprecated: false };
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
