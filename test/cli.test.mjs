import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, collectDeps, render, makeColor } from "../bin/cli.mjs";

const noColor = makeColor(false);

test("parseArgs defaults and flags", () => {
  assert.deepEqual(parseArgs([]).failOn, "phantom");
  assert.equal(parseArgs(["--json"]).json, true);
  assert.equal(parseArgs(["--include-code"]).includeCode, true);
  assert.equal(parseArgs(["-q"]).quiet, true);
  assert.equal(parseArgs(["--fail-on", "danger"]).failOn, "danger");
  assert.equal(parseArgs(["--fail-on=warn"]).failOn, "warn");
  assert.equal(parseArgs(["./myproj"]).path, "./myproj");
  assert.equal(parseArgs(["--bogus"]).badFlag, "--bogus");
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

test("render quiet mode omits OK rows but keeps the summary", () => {
  const out = render([
    { name: "express", ecosystem: "npm", level: "ok" },
    { name: "bad", ecosystem: "npm", level: "phantom", title: "x" },
  ], { quiet: true }, noColor);
  assert.ok(!/express/.test(out), "OK row hidden in quiet mode");
  assert.match(out, /bad/);
});
