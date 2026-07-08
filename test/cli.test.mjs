import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, collectDeps, render, makeColor, safeText, capDeps, MAX_PACKAGES } from "../bin/cli.mjs";

const noColor = makeColor(false);

test("capDeps bounds the request count and reports the overflow", () => {
  const few = Array.from({ length: 10 }, (_, i) => ({ name: `p${i}`, ecosystem: "npm" }));
  assert.deepEqual(capDeps(few), { toCheck: few, overflow: 0 });

  const many = Array.from({ length: MAX_PACKAGES + 25 }, (_, i) => ({ name: `p${i}`, ecosystem: "npm" }));
  const capped = capDeps(many);
  assert.equal(capped.toCheck.length, MAX_PACKAGES, "never checks more than the ceiling");
  assert.equal(capped.overflow, 25, "overflow is reported, not dropped silently");
});

test("safeText strips terminal control characters from untrusted names", () => {
  const ESC = String.fromCharCode(27), BEL = String.fromCharCode(7);
  const evil = "evil" + ESC + "[2J" + ESC + "]0;title" + BEL + "pkg";
  const cleaned = safeText(evil);
  assert.ok(!cleaned.includes(ESC), "ESC must be removed");
  assert.ok(!cleaned.includes(BEL), "BEL must be removed");
  assert.ok(cleaned.includes("evil") && cleaned.includes("pkg"), "printable text is kept");
});

test("render does not emit raw escape sequences from a crafted package name", () => {
  const ESC = String.fromCharCode(27);
  const out = render([{ name: "x" + ESC + "[31mINJECT", ecosystem: "npm", level: "phantom", title: "t" }],
    { quiet: false }, noColor);
  assert.ok(!out.includes(ESC), "no raw ESC in the rendered output");
});

test("parseArgs defaults and flags", () => {
  assert.deepEqual(parseArgs([]).failOn, "phantom");
  assert.equal(parseArgs(["--json"]).json, true);
  assert.equal(parseArgs(["--include-code"]).includeCode, true);
  assert.equal(parseArgs(["-q"]).quiet, true);
  assert.equal(parseArgs(["--fail-on", "danger"]).failOn, "danger");
  assert.equal(parseArgs(["--fail-on=warn"]).failOn, "warn");
  assert.equal(parseArgs(["./myproj"]).path, "./myproj");
  assert.equal(parseArgs(["--bogus"]).badFlag, "--bogus");
  assert.equal(parseArgs(["--fail-on"]).failOn, undefined, "missing value is detectable");
  assert.equal(parseArgs(["a", "b"]).extraArg, "b", "extra positional is surfaced, not swallowed");
});

test("collectDeps reads pyproject.toml", () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-"));
  try {
    writeFileSync(join(dir, "pyproject.toml"), [
      '[project]',
      'dependencies = ["requests>=2.31", "flask"]',
    ].join("\n"));
    const { deps, manifests } = collectDeps(dir, false);
    assert.equal(manifests, 1);
    assert.deepEqual(deps.map(d => d.name), ["requests", "flask"]);
    assert.ok(deps.every(d => d.ecosystem === "pypi"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("collectDeps reads package.json and requirements, dedupes, tags files", () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-"));
  try {
    writeFileSync(join(dir, "package.json"), JSON.stringify({
      dependencies: { express: "^4", "@scope/pkg": "1.0.0" },
      devDependencies: { vitest: "*" }
    }));
    writeFileSync(join(dir, "requirements.txt"), "requests==2.31.0\nflask>=3\n");
    const { deps } = collectDeps(dir, false);
    const names = deps.map(d => d.name).sort();
    assert.deepEqual(names, ["@scope/pkg", "express", "flask", "requests", "vitest"]);
    assert.ok(deps.every(d => d.file));
    assert.ok(deps.find(d => d.name === "requests").ecosystem === "pypi");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("collectDeps strips a UTF-8 BOM so Windows-edited manifests still parse", () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-"));
  try {
    // Prepend the BOM and use CRLF, exactly what a Windows editor writes.
    const body = JSON.stringify({ dependencies: { express: "^4" } }).replace(/\n/g, "\r\n");
    writeFileSync(join(dir, "package.json"), "﻿" + body);
    const { deps, unreadable } = collectDeps(dir, false);
    assert.deepEqual(deps.map(d => d.name), ["express"]);
    assert.equal(unreadable.length, 0, "a BOM is not a parse failure");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("collectDeps reports an unparseable manifest instead of silently passing", () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-"));
  try {
    writeFileSync(join(dir, "package.json"), '{ "dependencies": { "express": "^4"  '); // truncated
    const { deps, manifests, unreadable } = collectDeps(dir, false);
    assert.equal(deps.length, 0);
    assert.equal(manifests, 1, "the file was found");
    assert.deepEqual(unreadable, ["package.json"], "and flagged as unparseable, not treated as empty");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("collectDeps skips node_modules and only scans code with --include-code", () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-"));
  try {
    writeFileSync(join(dir, "app.js"), 'import x from "some-lib";\nimport fs from "node:fs";');
    mkdirSync(join(dir, "node_modules", "junk"), { recursive: true });
    writeFileSync(join(dir, "node_modules", "junk", "package.json"), JSON.stringify({ dependencies: { "should-not-appear": "1" } }));
    assert.equal(collectDeps(dir, false).deps.length, 0, "no manifests at root, code not scanned by default");
    const withCode = collectDeps(dir, true);
    assert.deepEqual(withCode.deps.map(d => d.name), ["some-lib"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("render shows a clean all-real report", () => {
  const out = render([
    { name: "express", ecosystem: "npm", level: "ok" },
    { name: "lodash", ecosystem: "npm", level: "ok" },
  ], { quiet: false }, noColor);
  assert.match(out, /Every dependency is real/);
  assert.match(out, /2 real/);
});

test("render highlights phantoms and the do-not-install banner", () => {
  const out = render([
    { name: "react", ecosystem: "npm", level: "ok" },
    { name: "made-up", ecosystem: "npm", level: "phantom", title: "Not found in the registry", detail: "No such package." },
  ], { quiet: false }, noColor);
  assert.match(out, /PHANTOM/);
  assert.match(out, /could not be trusted/);
  assert.match(out, /1 phantom/);
});

test("render never claims success when every package errored", () => {
  const out = render([
    { name: "a", ecosystem: "npm", level: "error", title: "Could not check" },
    { name: "b", ecosystem: "npm", level: "error", title: "Could not check" },
  ], { quiet: false }, noColor);
  assert.ok(!/Every dependency is real/.test(out), "must not claim success");
  assert.match(out, /Could not reach the registries|Nothing was verified/);
});

test("render notes unchecked packages when some errored but others were fine", () => {
  const out = render([
    { name: "real", ecosystem: "npm", level: "ok" },
    { name: "flaky", ecosystem: "npm", level: "error", title: "Could not check" },
  ], { quiet: false }, noColor);
  assert.match(out, /could not be checked/);
  assert.ok(!/Every dependency is real/.test(out));
});

test("render quiet mode omits OK rows but keeps the summary", () => {
  const out = render([
    { name: "express", ecosystem: "npm", level: "ok" },
    { name: "bad", ecosystem: "npm", level: "phantom", title: "x" },
  ], { quiet: true }, noColor);
  assert.ok(!/express/.test(out), "OK row hidden in quiet mode");
  assert.match(out, /bad/);
});
