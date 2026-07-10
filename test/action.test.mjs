import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { actionArgs } from "../bin/action.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const action = join(root, "bin", "action.mjs");

test("action inputs map to safe CLI arguments", () => {
  assert.deepEqual(actionArgs({}), [".", "--fail-on", "danger"]);
  assert.deepEqual(actionArgs({
    INPUT_PATH: "packages/api",
    INPUT_FAIL_ON: "warn",
    INPUT_INCLUDE_CODE: "true",
    INPUT_JSON: "1",
    INPUT_QUIET: "yes",
    INPUT_IGNORE: "@company/private, pypi:internal-lib"
  }), [
    "packages/api", "--fail-on", "warn", "--include-code", "--json", "--quiet",
    "--ignore", "@company/private", "--ignore", "pypi:internal-lib"
  ]);
});

test("action metadata uses the Node 24 adapter", () => {
  const metadata = readFileSync(join(root, "action.yml"), "utf8");
  assert.match(metadata, /using: node24/);
  assert.match(metadata, /main: bin\/action\.mjs/);
  assert.match(metadata, /fail_on:[\s\S]*?default: danger/);
});

test("action adapter runs the CLI in the requested workspace", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "prc-action-"));
  try {
    writeFileSync(join(workspace, "package.json"), "{}");
    const result = await new Promise((resolve) => {
      execFile(process.execPath, [action], {
        cwd: root,
        env: { ...process.env, GITHUB_WORKSPACE: workspace, INPUT_PATH: ".", INPUT_FAIL_ON: "danger" },
        timeout: 30000
      }, (error, stdout, stderr) => resolve({ code: error ? error.code ?? 1 : 0, stdout, stderr }));
    });
    assert.equal(result.code, 0);
    assert.match(result.stdout, /No dependencies to check/);
    assert.equal(result.stderr, "");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
