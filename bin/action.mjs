#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("./cli.mjs", import.meta.url));
const enabled = (value) => /^(1|true|yes|on)$/i.test(String(value ?? "").trim());

/** Translate GitHub Action inputs into the public CLI arguments. */
export function actionArgs(env = process.env) {
  const args = [String(env.INPUT_PATH || ".").trim() || "."];
  args.push("--fail-on", String(env.INPUT_FAIL_ON || "danger").trim() || "danger");
  if (enabled(env.INPUT_INCLUDE_CODE)) args.push("--include-code");
  if (enabled(env.INPUT_JSON)) args.push("--json");
  if (enabled(env.INPUT_QUIET)) args.push("--quiet");
  for (const name of String(env.INPUT_IGNORE || "").split(",").map(value => value.trim()).filter(Boolean)) {
    args.push("--ignore", name);
  }
  return args;
}

export function runAction(env = process.env) {
  const child = spawnSync(process.execPath, [CLI, ...actionArgs(env)], {
    cwd: env.GITHUB_WORKSPACE || process.cwd(),
    env,
    stdio: "inherit"
  });
  if (child.error) {
    console.error(`Package Reality Check could not start: ${child.error.message}`);
    return 2;
  }
  return child.status ?? 2;
}

let isEntryPoint = false;
try {
  isEntryPoint = Boolean(process.argv[1]) &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
} catch { /* imported or invoked through an invalid path */ }

if (isEntryPoint) {
  process.exitCode = runAction();
}
