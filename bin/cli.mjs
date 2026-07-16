#!/usr/bin/env node
/**
 * Package Reality Check CLI
 *
 * Scans a project's dependencies and checks that they actually exist and
 * are plausibly legitimate, catching AI-hallucinated (slopsquatted)
 * packages and fresh typosquats before they reach your machine. This is
 * the layer upstream of a vulnerability scanner: you cannot scan a
 * package that does not exist yet, but you can refuse to install it.
 *
 * Zero runtime dependencies. A supply-chain tool must not be one.
 */

import { readFileSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join, resolve, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePackageJson, parseRequirements, parsePyproject, parseJsImports, parsePyImports, normalizePypi } from "../docs/checker.js";
import { checkAll } from "../docs/registry.js";
import { printBanner } from "./banner.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const VERSION = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8")).version;

/* ------------------------------- args ------------------------------- */

export function parseArgs(argv) {
  const opts = { path: ".", json: false, failOn: "danger", includeCode: false, quiet: false, color: null, ignore: [] };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--include-code") opts.includeCode = true;
    else if (a === "--quiet" || a === "-q") opts.quiet = true;
    else if (a === "--no-color") opts.color = false;
    else if (a === "--color") opts.color = true;
    else if (a === "--fail-on") opts.failOn = argv[++i];
    else if (a.startsWith("--fail-on=")) opts.failOn = a.slice("--fail-on=".length);
    else if (a === "--ignore") {
      const value = argv[++i];
      if (value === undefined) opts.missingIgnore = true;
      else opts.ignore.push(value);
    }
    else if (a.startsWith("--ignore=")) opts.ignore.push(a.slice("--ignore=".length));
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "-v" || a === "--version") opts.version = true;
    else if (a.startsWith("-")) { opts.badFlag = a; }
    else rest.push(a);
  }
  if (rest[0]) opts.path = rest[0];
  if (rest.length > 1) opts.extraArg = rest[1];
  return opts;
}

const HELP = `package-reality-check ${VERSION}
Check that your dependencies actually exist and are plausibly legitimate.
Catches AI-hallucinated packages and fresh typosquats before you install them.

USAGE
  npx github:JaydenYoonZK/package-reality-check [path] [options]

ARGUMENTS
  path                 Project directory to scan (default: current directory)

OPTIONS
  --fail-on <level>    Exit non-zero when a finding is at or above this level:
                         danger (default) | phantom | warn | never
  --include-code       Also scan .js/.ts/.py imports, not just manifests
  --ignore <name>      Skip an approved private package. Repeat as needed;
                       use npm:name or pypi:name to limit the ecosystem
  --json               Machine-readable output
  --quiet, -q          Only print problems and the summary
  --no-color           Disable colored output
  -h, --help           Show this help
  -v, --version        Show version

WHAT IT CHECKS
  package.json (all dependency fields), requirements.txt, and
  pyproject.toml (PEP 621, Poetry, and build-system requires) against the
  live npm and PyPI registries. Flags packages that do not exist, that are
  brand new, deprecated, barely downloaded, one edit away from a popular
  name, or replaced by a registry security placeholder. Node built-ins and
  the Python standard library are skipped.

EXIT CODES
  0  clean (nothing at or above --fail-on)
  1  findings at or above --fail-on
  2  usage error, no manifest found, or nothing could be verified`;

/* ------------------------------- color ------------------------------- */

export function makeColor(enabled) {
  const wrap = (code) => (s) => enabled ? `\x1b[${code}m${s}\x1b[0m` : String(s);
  return {
    on: enabled,
    red: wrap("31"), green: wrap("32"), yellow: wrap("33"), blue: wrap("34"),
    dim: wrap("2"), bold: wrap("1"), cyan: wrap("36"),
  };
}

// Package names and file paths come from untrusted manifests. A crafted name
// containing terminal escape sequences could clear the screen, set the title,
// or inject fake output when printed. Replace every control character before
// it reaches terminal or JSON output.
export function safeText(s) {
  return String(s).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "\uFFFD");
}

// A generous ceiling on how many packages one run will look up. A real
// monorepo lands well under this; a hostile or broken manifest with a huge
// dependency list should not turn a scan into an unbounded flood of registry
// requests. When the ceiling is hit, the overflow is reported, never dropped
// silently.
export const MAX_PACKAGES = 2000;

/** Bound the work: keep the first `max`, report how many overflow. */
export function capDeps(deps, max = MAX_PACKAGES) {
  const overflow = deps.length - max;
  return overflow > 0 ? { toCheck: deps.slice(0, max), overflow } : { toCheck: deps, overflow: 0 };
}

function ignoreMatches(dep, entry) {
  let ecosystem = null;
  let name = String(entry).trim();
  const qualified = name.match(/^(npm|pypi):(.*)$/i);
  if (qualified) {
    ecosystem = qualified[1].toLowerCase();
    name = qualified[2];
  }
  if (!name || (ecosystem && ecosystem !== dep.ecosystem)) return false;
  return dep.ecosystem === "pypi"
    ? normalizePypi(name) === normalizePypi(dep.name)
    : name.toLowerCase() === dep.name.toLowerCase();
}

/** Separate explicitly approved private packages from dependencies to check. */
export function partitionIgnored(deps, entries = []) {
  const ignored = [];
  const included = [];
  for (const dep of deps) {
    (entries.some(entry => ignoreMatches(dep, entry)) ? ignored : included).push(dep);
  }
  return { included, ignored };
}

/* --------------------------- file discovery --------------------------- */

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", "venv", ".venv", "__pycache__", "vendor", ".cache"]);
const CODE_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py"]);

function walk(dir, files = [], depth = 0) {
  if (depth > 8) return files;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return files; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      // Skip vendored/build directories and any hidden directory (.git,
      // .github, .venv, caches). Project manifests live in visible folders.
      if (SKIP_DIRS.has(e.name) || e.name.startsWith(".")) continue;
      walk(full, files, depth + 1);
    } else {
      files.push(full);
    }
  }
  return files;
}

function isRequirementsFile(name) {
  return /^(requirements[\w.-]*\.txt|dev-requirements\.txt|constraints\.txt)$/i.test(name);
}

// Read a manifest as text, honoring a UTF-16 byte-order mark. PowerShell's
// `pip freeze > requirements.txt` writes UTF-16LE by default; decoding that as
// UTF-8 would yield garbage that parses to zero dependencies and a false clean.
function readText(f) {
  const buf = readFileSync(f);
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
    return buf.toString("utf16le").replace(/^﻿/, "");
  }
  if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) {
    const swapped = Buffer.from(buf.subarray(buf.length % 2 === 0 ? 0 : 1));
    swapped.swap16(); // Node decodes only little-endian UTF-16
    return swapped.toString("utf16le").replace(/^﻿/, "");
  }
  return buf.toString("utf8").replace(/^﻿/, "");
}

export function collectDeps(root, includeCode) {
  const deps = [];
  const seen = new Set();
  const unreadable = [];
  let manifests = 0;
  const rel = (file) => relative(root, file) || basename(file);
  const push = (list, file) => {
    for (const d of list) {
      const key = d.ecosystem + ":" + d.name;
      if (seen.has(key)) continue;
      seen.add(key);
      deps.push({ ...d, file: rel(file) });
    }
  };

  const all = walk(root);
  for (const f of all) {
    const name = basename(f);
    if (name === "package.json") {
      manifests++;
      try { push(parsePackageJson(readText(f)), f); }
      catch { unreadable.push(rel(f)); }   // a manifest we cannot parse must not read as clean
    } else if (isRequirementsFile(name)) {
      manifests++;
      try { push(parseRequirements(readText(f)), f); }
      catch { unreadable.push(rel(f)); }
    } else if (name === "pyproject.toml") {
      manifests++;
      try { push(parsePyproject(readText(f)), f); }
      catch { unreadable.push(rel(f)); }
    } else if (includeCode && CODE_EXT.has(extname(f))) {
      try {
        const text = readText(f);
        push(extname(f) === ".py" ? parsePyImports(text) : parseJsImports(text), f);
      } catch { /* a single source file is best-effort; skip quietly */ }
    }
  }
  return { deps, manifests, unreadable };
}

/* ------------------------------- output ------------------------------- */

const LEVELS = ["ok", "warn", "danger", "phantom"];
const RANK = { error: -1, ok: 0, warn: 1, danger: 2, phantom: 3 };
const LABEL = { phantom: "PHANTOM", danger: "DANGER", warn: "CHECK", ok: "OK", error: "ERROR" };

function colorFor(c, level) {
  return level === "phantom" || level === "danger" ? c.red
    : level === "warn" ? c.yellow
    : level === "error" ? c.dim
    : c.green;
}

export function render(results, opts, c) {
  const counts = { phantom: 0, danger: 0, warn: 0, ok: 0, error: 0 };
  for (const r of results) counts[r.level]++;

  const order = [...results].sort((a, b) => (RANK[b.level] - RANK[a.level]) || a.name.localeCompare(b.name));
  const width = Math.min(40, Math.max(...results.map(r => safeText(r.name).length), 8));

  const lines = [];
  lines.push("");
  lines.push(c.bold("  Package Reality Check") + c.dim(`  ·  ${results.length} package${results.length === 1 ? "" : "s"}`));
  lines.push("");

  for (const r of order) {
    if (opts.quiet && (r.level === "ok")) continue;
    const mark = r.level === "phantom" || r.level === "danger" ? "✗"
      : r.level === "warn" ? "!"
      : r.level === "error" ? "?" : "✓";
    const tone = colorFor(c, r.level);
    const eco = c.dim(r.ecosystem.padEnd(4));
    const clean = safeText(r.name);
    const name = clean.length > width ? clean.slice(0, width - 1) + "…" : clean.padEnd(width);
    let line = `  ${tone(mark)} ${eco} ${name}  ${tone(LABEL[r.level])}`;
    if (r.title && r.level !== "ok") line += c.dim("  " + r.title);
    lines.push(line);
    if (!opts.quiet && r.detail && r.level !== "ok") {
      lines.push(c.dim(`       ${r.detail}`));
    }
  }

  lines.push("");
  const bad = counts.phantom + counts.danger;
  const summaryBits = [];
  if (counts.phantom) summaryBits.push(c.red(`${counts.phantom} phantom`));
  if (counts.danger) summaryBits.push(c.red(`${counts.danger} dangerous`));
  if (counts.warn) summaryBits.push(c.yellow(`${counts.warn} to review`));
  if (counts.error) summaryBits.push(c.dim(`${counts.error} unchecked`));
  summaryBits.push(c.green(`${counts.ok} real`));
  lines.push("  " + summaryBits.join(c.dim("  ·  ")));

  const checked = counts.ok + counts.phantom + counts.danger + counts.warn;
  if (bad) {
    lines.push("");
    lines.push("  " + c.red(c.bold(`✗ ${bad} package${bad === 1 ? "" : "s"} could not be trusted.`)) +
      c.dim(" Do not install until you have verified each one."));
  } else if (checked === 0) {
    // Everything errored: we verified nothing, so we must not claim success.
    lines.push("");
    lines.push("  " + c.yellow(c.bold("Could not reach the registries.")) +
      c.dim(" Nothing was verified. Check your connection and try again."));
  } else if (counts.warn || counts.error) {
    const note = counts.error ? ` ${counts.error} could not be checked.` : "";
    lines.push("  " + c.yellow("All checked packages exist. A few are worth a quick look." + note).trimEnd());
  } else {
    lines.push("  " + c.green(c.bold("✓ Every dependency is real and established.")));
  }
  lines.push("");
  return lines.join("\n");
}

/** Convert completed results and a threshold into the documented CLI exit code. */
export function exitCodeForResults(results, failOn) {
  const checked = results.filter(r => r.level !== "error").length;
  if (checked === 0 && results.length > 0) return 2;
  const threshold = RANK[failOn] ?? 99;
  const worst = results.reduce((max, result) => Math.max(max, RANK[result.level] ?? -1), -1);
  return failOn !== "never" && worst >= threshold ? 1 : 0;
}

/* ------------------------------- main ------------------------------- */

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { printBanner(`package-reality-check v${VERSION}`, { color: opts.color }); console.log(HELP); process.exit(0); }
  if (opts.version) { console.log(VERSION); process.exit(0); }
  if (opts.badFlag) { console.error(`Unknown option: ${safeText(opts.badFlag)}\nRun with --help.`); process.exit(2); }
  if (opts.extraArg) { console.error(`Unexpected argument: ${safeText(opts.extraArg)}. Pass a single project directory.`); process.exit(2); }
  if (opts.failOn === undefined || opts.failOn === "") {
    console.error("Missing value for --fail-on. Use phantom, danger, warn, or never."); process.exit(2);
  }
  if (opts.missingIgnore || opts.ignore.some(value => !String(value).trim())) {
    console.error("Missing value for --ignore. Pass a package name, npm:name, or pypi:name."); process.exit(2);
  }
  if (!["phantom", "danger", "warn", "never"].includes(opts.failOn)) {
    console.error(`Invalid --fail-on value: ${safeText(opts.failOn)}. Use phantom, danger, warn, or never.`); process.exit(2);
  }

  const root = resolve(opts.path);
  try { if (!statSync(root).isDirectory()) throw 0; }
  catch { console.error(`Not a directory: ${safeText(opts.path)}`); process.exit(2); }

  if (!opts.json && !opts.quiet) printBanner(`package-reality-check v${VERSION}`, { color: opts.color });
  const colorEnabled = opts.color !== null ? opts.color : (process.stdout.isTTY && !process.env.NO_COLOR);
  const c = makeColor(colorEnabled);

  const collected = collectDeps(root, opts.includeCode);
  const { included: deps, ignored } = partitionIgnored(collected.deps, opts.ignore);
  const { manifests, unreadable } = collected;
  if (!deps.length) {
    // A manifest we found but could not parse must never read as a clean pass.
    if (unreadable.length) {
      if (opts.json) console.log(JSON.stringify({ packages: 0, results: [], unreadable: unreadable.map(safeText), message: "Could not parse manifest" }));
      else console.error(c.yellow(`\n  Could not parse ${unreadable.length === 1 ? "this manifest" : "these manifests"}:`) +
        "\n" + unreadable.map(f => `    ${safeText(f)}`).join("\n") +
        c.dim("\n\n  Fix the file (a stray comma or a truncated line will do it) and run again.\n"));
      process.exit(2);
    }
    if (manifests > 0) {
      const message = ignored.length
        ? `All ${ignored.length} discovered dependencies were explicitly ignored`
        : "No dependencies to check";
      if (opts.json) console.log(JSON.stringify({
        packages: 0,
        ignored: ignored.map(dep => ({ name: safeText(dep.name), ecosystem: dep.ecosystem })),
        results: [],
        message
      }));
      else console.log(c.green(`\n  ✓ ${message}.\n`));
      process.exit(0);
    }
    if (opts.json) console.log(JSON.stringify({ packages: 0, results: [], message: "No manifest found" }));
    else console.error("No package.json, requirements.txt, or pyproject.toml found here. Point at a project directory" +
      (opts.includeCode ? "." : ", or pass --include-code to scan source imports."));
    process.exit(2);
  }
  if (unreadable.length && !opts.json && !opts.quiet) {
    process.stderr.write(c.yellow(`  Note: could not parse ${unreadable.map(safeText).join(", ")}, so those files were skipped.\n`));
  }
  if (ignored.length && !opts.json && !opts.quiet) {
    process.stderr.write(c.dim(`  Ignoring ${ignored.length} explicitly approved package${ignored.length === 1 ? "" : "s"}: ${ignored.map(dep => safeText(dep.name)).join(", ")}\n`));
  }

  // Bound the work. Anything past the ceiling is reported, not silently dropped.
  const { toCheck, overflow } = capDeps(deps);
  if (overflow > 0 && !opts.json) {
    process.stderr.write(c.yellow(`  Note: ${deps.length} dependencies found; checking the first ${MAX_PACKAGES}. Split this project to check the remaining ${overflow}.\n`));
  }

  if (!opts.json && process.stderr.isTTY) {
    process.stderr.write(c.dim(`  Checking ${toCheck.length} package${toCheck.length === 1 ? "" : "s"} against npm and PyPI…\r`));
  }

  const results = await checkAll(toCheck, {
    onProgress: (done, total) => {
      if (!opts.json && process.stderr.isTTY) {
        process.stderr.write(c.dim(`  Checking ${done}/${total}…              \r`));
      }
    }
  });
  if (!opts.json && process.stderr.isTTY) process.stderr.write("                                   \r");

  const payload = opts.json
    ? JSON.stringify({
        packages: results.length,
        unreadable: unreadable.length ? unreadable.map(safeText) : undefined,
        ignored: ignored.length ? ignored.map(dep => ({ name: safeText(dep.name), ecosystem: dep.ecosystem })) : undefined,
        notChecked: overflow > 0 ? overflow : undefined,
        results: results.map(r => ({
          name: safeText(r.name), ecosystem: r.ecosystem, level: r.level,
          title: r.title || null, detail: r.detail || null, source: r.source || null,
          file: r.file ? safeText(r.file) : null
        }))
      }, null, 2)
    : render(results, opts, c);

  // If nothing could be checked (every lookup errored), we verified nothing.
  // Do not report success: exit 2 so CI treats it as an incomplete run.
  const code = exitCodeForResults(results, opts.failOn);
  // Write, then exit only once stdout has drained. On a pipe Node's stdout is
  // async, and calling process.exit() straight away would cut a large report
  // off at the OS pipe buffer (64 KB), corrupting --json for big projects.
  writeAndExit(payload + "\n", code);
}

// Write to stdout and exit after the write is fully flushed, so piped output
// is never truncated. If stdout is already closed (a downstream `head`), fall
// back to exiting immediately.
function writeAndExit(text, code) {
  try {
    const flushed = process.stdout.write(text);
    if (flushed) process.exit(code);
    else process.stdout.once("drain", () => process.exit(code));
    // Safety net: never hang if the drain event does not arrive.
    process.stdout.once("error", () => process.exit(code));
  } catch {
    process.exit(code);
  }
}

// Run main() only when invoked as a command, not when imported by tests.
// npm installs bins as symlinks, so compare real paths, not raw argv.
function isEntryPoint() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}
if (isEntryPoint() || process.env.PRC_RUN === "1") {
  main().catch((e) => { console.error("Unexpected error:", safeText(e?.message || e)); process.exit(2); });
}
