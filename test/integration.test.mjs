import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Integration tests: run the real CLI as a subprocess and assert the exit-code
// contract that CI users depend on. Every case here is offline (no manifest,
// empty manifest, unreadable manifest, usage errors), so the suite stays
// deterministic and network-free.

const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "cli.mjs");

function run(args, cwd) {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLI, ...args], { cwd, timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code ?? 1 : 0, stdout, stderr });
    });
  });
}

test("exit 0 and version on --version", async () => {
  const r = await run(["--version"]);
  assert.equal(r.code, 0);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("exit 0 and usage on --help", async () => {
  const r = await run(["--help"]);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /USAGE/);
  assert.match(r.stdout, /EXIT CODES/);
});

test("exit 2 when pointed at a directory with no manifest", async () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-int-"));
  try {
    const r = await run([dir]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /No package\.json/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("exit 0 when a manifest exists but declares no dependencies", async () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-int-"));
  try {
    writeFileSync(join(dir, "package.json"), "{}");
    const r = await run([dir, "--no-color"]);
    assert.equal(r.code, 0);
    assert.match(r.stdout, /No dependencies to check/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("exit 2 when the only manifest cannot be parsed", async () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-int-"));
  try {
    writeFileSync(join(dir, "package.json"), '{ "dependencies": { "express": "^4"');
    const r = await run([dir, "--no-color"]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /Could not parse/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("exit 2 on an unknown flag, a bad --fail-on, and a missing directory", async () => {
  const bogus = await run(["--bogus"]);
  assert.equal(bogus.code, 2);
  assert.match(bogus.stderr, /Unknown option/);

  const badFail = await run(["--fail-on", "sometimes"]);
  assert.equal(badFail.code, 2);
  assert.match(badFail.stderr, /Invalid --fail-on/);

  const missingValue = await run(["--fail-on"]);
  assert.equal(missingValue.code, 2);
  assert.match(missingValue.stderr, /Missing value/);

  const noDir = await run([join(tmpdir(), "prc-does-not-exist-zzz")]);
  assert.equal(noDir.code, 2);
  assert.match(noDir.stderr, /Not a directory/);
});

test("exit 2 and JSON error shape for an unreadable manifest with --json", async () => {
  const dir = mkdtempSync(join(tmpdir(), "prc-int-"));
  try {
    writeFileSync(join(dir, "package.json"), "not json at all");
    const r = await run([dir, "--json"]);
    assert.equal(r.code, 2);
    const parsed = JSON.parse(r.stdout);
    assert.deepEqual(parsed.unreadable, ["package.json"]);
    assert.equal(parsed.packages, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
