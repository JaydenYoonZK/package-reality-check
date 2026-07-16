import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extract, parsePackageJson, resolveNpmDep, parseRequirements, parsePyproject, parseJsImports, parsePyImports,
  editDistance, lookalikeOf, normalizePypi, verdict, registryUrls, isValidPackageName,
  POPULAR_NPM, POPULAR_PYPI, PY_IMPORT_DISTRIBUTIONS
} from "../docs/checker.js";

test("parsePyproject reads PEP 621 dependencies, optional groups, and build requires", () => {
  const deps = parsePyproject([
    '[build-system]',
    'requires = ["setuptools>=61", "wheel"]',
    '',
    '[project]',
    'name = "myapp"',
    'classifiers = [',
    '  "Programming Language :: Python :: 3",',
    ']',
    'dependencies = [',
    '  "requests>=2.31",',
    '  "uvicorn[standard]>=0.29",  # server',
    "  \"pydantic ; python_version >= '3.8'\",",
    ']',
    '',
    '[project.optional-dependencies]',
    'dev = ["pytest>=8", "ruff"]',
    '',
    '[project.urls]',
    'Homepage = "https://example.com"',
  ].join("\n"));
  assert.deepEqual(deps.map(d => d.name),
    ["setuptools", "wheel", "requests", "uvicorn", "pydantic", "pytest", "ruff"]);
  assert.ok(deps.every(d => d.ecosystem === "pypi" && d.source === "pyproject"));
});

test("parsePyproject reads Poetry dependency tables, skipping python itself", () => {
  const deps = parsePyproject([
    '[tool.poetry.dependencies]',
    'python = "^3.11"',
    'requests = "^2.31"',
    'uvicorn = { extras = ["standard"], version = "^0.29" }',
    '"tomli" = "^2"',
    '',
    '[tool.poetry.group.dev.dependencies]',
    'pytest = "^8"',
  ].join("\n"));
  assert.deepEqual(deps.map(d => d.name), ["requests", "uvicorn", "tomli", "pytest"]);
  // inline-table values ("standard", "^0.29") must never leak in as names
  assert.ok(!deps.some(d => /\^|standard/.test(d.name)));
});

test("extract() detects a pasted pyproject.toml", () => {
  const r = extract('[project]\ndependencies = ["requests>=2"]');
  assert.equal(r.kind, "pyproject.toml");
  assert.deepEqual(r.deps.map(d => d.name), ["requests"]);
});

test("isValidPackageName accepts real names and rejects paths/URLs/injection", () => {
  for (const ok of ["express", "left-pad", "socket.io", "q", "JSONStream", "@types/node", "@babel/core"]) {
    assert.equal(isValidPackageName(ok, "npm"), true, `${ok} should be valid`);
  }
  for (const bad of ["../../-/npm/v1/x", "foo/bar", "foo?x=1", "foo#frag", "foo bar", "", ".hidden", "a..b", "@/no-scope", "@scope/a/b"]) {
    assert.equal(isValidPackageName(bad, "npm"), false, `${bad} should be invalid`);
  }
  assert.equal(isValidPackageName("requests", "pypi"), true);
  assert.equal(isValidPackageName("../evil", "pypi"), false);
});

test("verdict: an invalid name is a phantom, not a lookup", () => {
  const v = verdict("../../etc/passwd", "npm", { exists: false, invalid: true });
  assert.equal(v.level, "phantom");
  assert.match(v.title, /Not a valid package name/);
});

test("homoglyph names (non-ASCII lookalikes) are invalid, not lookup-able", () => {
  // "reаct" with a Cyrillic "а": such a name cannot exist on npm or PyPI,
  // so it must be rejected as invalid rather than queried.
  const cyrillicA = String.fromCharCode(0x0430);
  assert.equal(isValidPackageName("re" + cyrillicA + "ct", "npm"), false);
  assert.equal(isValidPackageName("re" + cyrillicA + "ct", "pypi"), false);
});

test("verdict: a security-holding package is danger, outranking download age", () => {
  const now = Date.parse("2026-07-08");
  const v = verdict("flatmap-stream", "npm",
    { exists: true, securityHolding: true, downloads: 333, createdAt: "2018-01-01T00:00:00Z" }, now);
  assert.equal(v.level, "danger");
  assert.match(v.title, /security placeholder/i);
});

test("resolveNpmDep skips non-registry deps and resolves npm aliases", () => {
  assert.equal(resolveNpmDep("express", "^4.18.0"), "express");
  assert.equal(resolveNpmDep("x", "*"), "x");
  assert.equal(resolveNpmDep("x", ""), "x");
  assert.equal(resolveNpmDep("my-local", "file:../my-local"), null);
  assert.equal(resolveNpmDep("ws", "workspace:*"), null);
  assert.equal(resolveNpmDep("g", "git+https://github.com/x/y.git"), null);
  assert.equal(resolveNpmDep("g", "github:user/repo"), null);
  assert.equal(resolveNpmDep("s", "expressjs/express"), null);
  assert.equal(resolveNpmDep("t", "https://example.com/p.tgz"), null);
  assert.equal(resolveNpmDep("aliased", "npm:real-package@^1.0.0"), "real-package");
  assert.equal(resolveNpmDep("a", "npm:@vue/compiler@^3.0.0"), "@vue/compiler");
});

test("parsePackageJson skips workspace and local deps (no monorepo false phantoms)", () => {
  const deps = parsePackageJson(JSON.stringify({ dependencies: {
    express: "^4", "@my/pkg": "workspace:*", local: "file:../local", real: "npm:left-pad@^1"
  }}));
  const names = deps.map(d => d.name).sort();
  assert.deepEqual(names, ["express", "left-pad"]);
});

test("parsePackageJson does not pollute Object.prototype via crafted keys", () => {
  const mal = JSON.stringify({ dependencies: { "__proto__": "1.0.0", "constructor": "1.0.0", "real": "^1" } });
  parsePackageJson(mal);
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
  // and a crafted __proto__ value object must not become the prototype
  parsePackageJson('{"dependencies":{"__proto__":{"polluted":"x"}}}');
  assert.equal(({}).polluted, undefined, "no prototype pollution from a nested __proto__ value");
});

test("parsePackageJson ignores a malformed dependency block (no junk names)", () => {
  // A dependencies field that is a string or array is malformed. Object.entries
  // would otherwise turn it into deps named "0", "1", ... Each must yield none.
  assert.deepEqual(parsePackageJson(JSON.stringify({ dependencies: "express" })), []);
  assert.deepEqual(parsePackageJson(JSON.stringify({ dependencies: ["express", "lodash"] })), []);
  assert.deepEqual(parsePackageJson(JSON.stringify({ dependencies: 42 })), []);
  assert.deepEqual(parsePackageJson(JSON.stringify({ dependencies: null })), []);
  // A valid block alongside a malformed one still yields the valid names.
  const mixed = parsePackageJson(JSON.stringify({ dependencies: { express: "^4" }, devDependencies: ["bad"] }));
  assert.deepEqual(mixed.map(d => d.name), ["express"]);
});

test("parses package.json across dependency fields", () => {
  const deps = parsePackageJson(JSON.stringify({
    dependencies: { express: "^4.18.0", "@scope/pkg": "1.0.0" },
    devDependencies: { jest: "*" },
    peerDependencies: { react: ">=18" }
  }));
  assert.deepEqual(deps.map(d => d.name).sort(),
    ["@scope/pkg", "express", "jest", "react"]);
  assert.ok(deps.every(d => d.ecosystem === "npm"));
});

test("parses requirements.txt with specifiers, extras, markers, comments", () => {
  const deps = parseRequirements([
    "requests>=2.31   # http client",
    "uvicorn[standard]==0.29.0",
    'pydantic ; python_version >= "3.8"',
    "-r other.txt",
    "git+https://github.com/x/y.git",
    "",
    "# full comment line",
    "Flask_SQLAlchemy"
  ].join("\n"));
  assert.deepEqual(deps.map(d => d.name),
    ["requests", "uvicorn", "pydantic", "Flask_SQLAlchemy"]);
});

test("extracts JS imports, skipping relative, node builtins, and deep paths", () => {
  const deps = parseJsImports(`
    import express from "express";
    import { thing } from "./local.js";
    import fs from "node:fs";
    import path from "path";
    const c = require('chalk');
    import x from "@aws-sdk/client-s3/commands";
    const dyn = await import("lodash/merge");
  `);
  assert.deepEqual(deps.map(d => d.name).sort(),
    ["@aws-sdk/client-s3", "chalk", "express", "lodash"]);
});

test("parseJsImports is not vulnerable to catastrophic backtracking (ReDoS)", () => {
  // `import` + a long run of whitespace + `from` with no closing quote once
  // caused exponential backtracking. This must complete near-instantly.
  const t0 = Date.now();
  parseJsImports("import " + " ".repeat(100000) + "from");
  parseJsImports("import {" + "a, ".repeat(100000) + "from ");
  const ms = Date.now() - t0;
  assert.ok(ms < 1000, `pathological import input should be fast, took ${ms}ms`);
});

test("parseJsImports ignores property-access calls named import/require", () => {
  const deps = parseJsImports('obj.require("nope"); foo.import("also-nope"); const c = require("real");');
  assert.deepEqual(deps.map(d => d.name), ["real"]);
});

test("parseJsImports ignores examples inside strings, comments, and regex literals", () => {
  const deps = parseJsImports(`
    const example = 'import fake from "fake-pkg"; require("also-fake")';
    // import nope from "comment-fake";
    /* export * from "block-fake"; */
    const re = /import x from "regex-fake"/g;
    import real from "real";
  `);
  assert.deepEqual(deps.map(d => d.name), ["real"]);
});

test("parseJsImports handles malformed syntax without leaking false imports", () => {
  assert.deepEqual(parseJsImports(`const s = "import fake from 'fake-pkg';`).map(d => d.name), []);
  assert.deepEqual(parseJsImports('const re = /import fake from "fake-pkg"\nimport real from "real";').map(d => d.name), ["real"]);
  assert.deepEqual(parseJsImports('const re = /import fake from "fake-pkg"').map(d => d.name), []);
  assert.deepEqual(parseJsImports('const dep = require("left\\-pad"); require("unterminated').map(d => d.name), ["left-pad"]);
});

test("parseJsImports handles multi-line and side-effect imports", () => {
  const deps = parseJsImports('import {\n a,\n b\n} from "multi";\nimport "side-effect";\nexport * from "rxjs";');
  assert.deepEqual(deps.map(d => d.name).sort(), ["multi", "rxjs", "side-effect"]);
});

test("extracts Python imports, skipping stdlib and relative", () => {
  const deps = parsePyImports(`
import os, json
import requests
from fastapi import FastAPI
from . import local
from mypkg.sub import thing
import telnetlib
  `);
  assert.deepEqual(deps.map(d => d.name).sort(), ["fastapi", "mypkg", "requests"]);
});

test("Python imports ignore docstrings, strings, and comments", () => {
  const deps = parsePyImports(`
"""
import fake_doc_example
from another_fake import nope
"""
example = "import fake_string"
escaped = "not an \\\"import fake_escaped\\\" statement"
# import fake_comment
import requests
  `);
  assert.deepEqual(deps.map(d => d.name), ["requests"]);
});

test("Python imports handle aliases and map common modules to distributions", () => {
  const deps = parsePyImports(`
import numpy as np, pandas as pd
import yaml, PIL.Image
from sklearn.model_selection import train_test_split
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from dateutil.parser import parse
import cv2
  `);
  assert.deepEqual(deps.map(d => d.name), [
    "numpy", "pandas", "PyYAML", "Pillow", "scikit-learn",
    "beautifulsoup4", "python-dotenv", "python-dateutil", "opencv-python"
  ]);
  assert.equal(deps.find(d => d.name === "PyYAML").alias, "yaml");
});

test("extract() detects input kind", () => {
  assert.equal(extract('{"dependencies":{"express":"*"}}').kind, "package.json");
  assert.equal(extract("requests==2.31.0\nflask>=3").kind, "requirements.txt");
  assert.equal(extract('import x from "express"').kind, "JavaScript code");
  assert.equal(extract("from flask import Flask").kind, "Python code");
  assert.equal(extract("").kind, "empty");
});

test("PEP 503 normalization", () => {
  assert.equal(normalizePypi("Flask_SQLAlchemy"), "flask-sqlalchemy");
  assert.equal(normalizePypi("zope.interface"), "zope-interface");
});

test("edit distance is OSA: an adjacent transposition costs one edit", () => {
  assert.equal(editDistance("requests", "reqeusts"), 1);   // eu swapped
  assert.equal(editDistance("lodash", "lodahs"), 1);       // hs swapped
  assert.equal(editDistance("react", "raect"), 1);         // ae swapped
  assert.equal(editDistance("vue", "veu"), 1);             // eu swapped
  assert.equal(editDistance("react", "react"), 0);
  assert.equal(editDistance("react", "reacts"), 1);        // insertion
  assert.equal(editDistance("react", "reoct"), 1);         // substitution
  assert.equal(editDistance("ab", "ba"), 1);               // pure swap
  assert.ok(editDistance("short", "completely-different", 2) > 2);
});

test("lookalike detection catches classic typos, including short-name transpositions", () => {
  assert.equal(lookalikeOf("reqeusts", "pypi"), "requests");
  assert.equal(lookalikeOf("lodahs", "npm"), "lodash");
  assert.equal(lookalikeOf("expresss", "npm"), "express");
  // Transpositions in short names were missed under plain Levenshtein
  // (a swap counted as 2 edits, above the limit of 1 for names under 6 chars).
  assert.equal(lookalikeOf("raect", "npm"), "react");
  assert.equal(lookalikeOf("veu", "npm"), "vue");
});

test("no popular package flags another popular package as its lookalike", () => {
  for (const p of POPULAR_NPM) assert.equal(lookalikeOf(p, "npm"), null, `${p} must not be a lookalike`);
  for (const p of POPULAR_PYPI) assert.equal(lookalikeOf(p, "pypi"), null, `${p} must not be a lookalike`);
});

test("exact popular names are not their own lookalike", () => {
  assert.equal(lookalikeOf("requests", "pypi"), null);
  assert.equal(lookalikeOf("express", "npm"), null);
});

test("verdict: wrong-ecosystem when found in the other registry", () => {
  const v = verdict("left-pad", "pypi", { exists: false, foundIn: "other" });
  assert.equal(v.level, "warn");
  assert.match(v.title, /on npm, not PyPI/);
});

test("verdict: phantom when missing", () => {
  const v = verdict("made-up-pkg-xyz", "npm", { exists: false });
  assert.equal(v.level, "phantom");
});

test("verdict: phantom with did-you-mean", () => {
  const v = verdict("reqeusts", "pypi", { exists: false });
  assert.equal(v.level, "phantom");
  assert.match(v.detail, /requests/);
});

test("verdict: danger for new lookalike", () => {
  const now = Date.parse("2026-07-07");
  const v = verdict("lodahs", "npm",
    { exists: true, createdAt: "2026-06-20T00:00:00Z", downloads: 12 }, now);
  assert.equal(v.level, "danger");
  assert.match(v.title, /lodash/);
});

test("verdict: warn for very new package", () => {
  const now = Date.parse("2026-07-07");
  const v = verdict("brand-new-thing", "npm",
    { exists: true, createdAt: "2026-06-01T00:00:00Z" }, now);
  assert.equal(v.level, "warn");
});

test("verdict: an established package resembling a popular name is not a typosquat", () => {
  const now = Date.parse("2026-07-08");
  // enquirer is near "inquirer" but old and hugely downloaded -> ok, not warn
  const enquirer = verdict("enquirer", "npm", { exists: true, createdAt: "2017-01-01T00:00:00Z", downloads: 30000000 }, now);
  assert.equal(enquirer.level, "ok");
  // serve is near "semver" but established -> ok
  const serve = verdict("serve", "npm", { exists: true, createdAt: "2016-01-01T00:00:00Z", downloads: 2000000 }, now);
  assert.equal(serve.level, "ok");
  // a fresh, low-download lookalike is still dangerous
  const fresh = verdict("lodahs", "npm", { exists: true, createdAt: "2026-06-20T00:00:00Z", downloads: 12 }, now);
  assert.equal(fresh.level, "danger");
});

test("verdict: an OLD but near-dead lookalike is still flagged (parked typosquat)", () => {
  const now = Date.parse("2026-07-08");
  // "raect" exists on npm: registered years ago, ~85 downloads a month, one
  // edit from react. Age alone must not suppress the lookalike signal when
  // the downloads are known to be tiny.
  const parked = verdict("raect", "npm", { exists: true, createdAt: "2019-01-01T00:00:00Z", downloads: 85 }, now);
  assert.equal(parked.level, "danger");
  assert.match(parked.title, /react/);
  // but an old lookalike with moderate, real use is left alone
  const modest = verdict("raect", "npm", { exists: true, createdAt: "2019-01-01T00:00:00Z", downloads: 5000 }, now);
  assert.equal(modest.level, "ok");
});

test("verdict: ok for established package", () => {
  const now = Date.parse("2026-07-07");
  const v = verdict("express", "npm",
    { exists: true, createdAt: "2010-01-01T00:00:00Z", downloads: 9999999 }, now);
  assert.equal(v.level, "ok");
});

// --- Boundary-value analysis: lock every threshold transition in place ---

const NOW_BVA = Date.UTC(2026, 6, 9);
const daysAgo = (n) => new Date(NOW_BVA - n * 86400000).toISOString();
const lvl = (name, facts) => verdict(name, "npm", facts, NOW_BVA).level;
const SAFE = "totally-unique-safe-name-zzz"; // no lookalike, isolates age/download flags

test("boundary: NEW_PACKAGE_DAYS is inclusive at 120", () => {
  assert.equal(lvl(SAFE, { exists: true, createdAt: daysAgo(119), downloads: 9e9 }), "warn");
  assert.equal(lvl(SAFE, { exists: true, createdAt: daysAgo(120), downloads: 9e9 }), "warn"); // 120 still new
  assert.equal(lvl(SAFE, { exists: true, createdAt: daysAgo(121), downloads: 9e9 }), "ok");   // 121 is not
});

test("boundary: LOW_DOWNLOADS flags strictly below 500", () => {
  assert.equal(lvl(SAFE, { exists: true, createdAt: daysAgo(200), downloads: 499 }), "warn");
  assert.equal(lvl(SAFE, { exists: true, createdAt: daysAgo(200), downloads: 500 }), "ok"); // 500 is fine
});

test("boundary: ESTABLISHED_DOWNLOADS suppresses a lookalike at exactly 20000", () => {
  assert.equal(lvl("raect", { exists: true, createdAt: daysAgo(200), downloads: 19999 }), "warn");
  assert.equal(lvl("raect", { exists: true, createdAt: daysAgo(200), downloads: 20000 }), "ok");
});

test("boundary: ESTABLISHED_DAYS establishes a lookalike only above 365", () => {
  assert.equal(lvl("raect", { exists: true, createdAt: daysAgo(365) }), "warn"); // 365 not yet established
  assert.equal(lvl("raect", { exists: true, createdAt: daysAgo(366) }), "ok");   // 366 is
});

test("verdict: a mid-popularity lookalike with no flags is a plain warn", () => {
  // raect, 200 days old (not new), 5000 downloads (not low, not established),
  // age <= 365 (not established by age): no flags, so a plain 'one edit away' warn.
  const v = verdict("raect", "npm", { exists: true, createdAt: daysAgo(200), downloads: 5000 }, NOW_BVA);
  assert.equal(v.level, "warn");
  assert.match(v.title, /One edit away from "react"/);
});

test("verdict: ok detail renders age in days for a sub-year established package", () => {
  const v = verdict(SAFE, "npm", { exists: true, createdAt: daysAgo(200), downloads: 9e9 }, NOW_BVA);
  assert.equal(v.level, "ok");
  assert.equal(v.detail, "registered 200 days ago");
});

test("parsePackageJson throws on a non-object top level", () => {
  for (const bad of ["null", "[1,2,3]", '"a string"', "42", "true"]) {
    assert.throws(() => parsePackageJson(bad), /not a JSON object/, `${bad} should throw`);
  }
  assert.doesNotThrow(() => parsePackageJson("{}"));
});

test("extract() returns unknown for input that is not any recognized format", () => {
  const r = extract("the quick brown fox jumps over the lazy dog");
  assert.equal(r.kind, "unknown");
  assert.deepEqual(r.deps, []);
});

test("verdict: ok-detail age reads naturally (singular year, no NaN)", () => {
  const now = Date.parse("2026-07-08");
  // ~1.5 years old -> "1 year", not "1 years"
  const oneYear = verdict("p", "npm", { exists: true, createdAt: "2025-01-01T00:00:00Z", downloads: 9e9 }, now);
  assert.equal(oneYear.detail, "registered 1 year ago");
  // ~2.5 years old -> "2 years"
  const twoYears = verdict("p", "npm", { exists: true, createdAt: "2024-01-01T00:00:00Z", downloads: 9e9 }, now);
  assert.equal(twoYears.detail, "registered 2 years ago");
  // an unparseable timestamp must not leak "NaN days"
  const bad = verdict("p", "npm", { exists: true, createdAt: "not-a-date", downloads: 9e9 }, now);
  assert.equal(bad.level, "ok");
  assert.ok(!/NaN/.test(bad.detail), `detail should not contain NaN, got: ${bad.detail}`);
});

test("registry URLs encode scoped and normalized names", () => {
  assert.equal(registryUrls("@scope/pkg", "npm").api,
    "https://registry.npmjs.org/%40scope%2Fpkg");
  assert.equal(registryUrls("@scope/pkg", "npm").latest,
    "https://registry.npmjs.org/%40scope%2Fpkg/latest");
  assert.equal(registryUrls("Flask_SQLAlchemy", "pypi").api,
    "https://pypi.org/pypi/flask-sqlalchemy/json");
});

test("parsePyproject skips Poetry git/path/url/file deps, keeps registry deps", () => {
  const deps = parsePyproject([
    '[tool.poetry.dependencies]',
    'python = "^3.11"',
    'requests = "^2.31"',
    'forked-httpx = { git = "https://github.com/x/httpx.git", branch = "main" }',
    'my-internal-lib = { path = "../internal", develop = true }',
    'some-tarball = { url = "https://example.com/pkg.tar.gz" }',
    'local-file-dep = { file = "dist/pkg.whl" }',
    'pinned = { version = "^1.2", extras = ["a"] }'
  ].join("\n"));
  const names = deps.map(d => d.name).sort();
  assert.deepEqual(names, ["pinned", "requests"]);
});

test("parseRequirements skips PEP 508 direct references (name @ url)", () => {
  const deps = parseRequirements([
    "requests==2.31.0",
    "flask",
    "myinternal-utils @ git+https://github.com/myorg/myinternal-utils.git@v1.2.0",
    "foo[bar] @ https://example.com/foo.whl",
    "localpkg @ file:///abs/path",
    "relpkg @ ./local",
    "normal-extras[x]>=1.0"
  ].join("\n"));
  const names = deps.map(d => d.name).sort();
  assert.deepEqual(names, ["flask", "normal-extras", "requests"]);
});

test("PY_IMPORT_DISTRIBUTIONS maps pyOpenSSL and pywin32 import names", () => {
  assert.equal(PY_IMPORT_DISTRIBUTIONS.OpenSSL, "pyOpenSSL");
  for (const mod of ["win32api", "win32con", "win32file", "win32com", "pythoncom", "pywintypes"]) {
    assert.equal(PY_IMPORT_DISTRIBUTIONS[mod], "pywin32");
  }
  const deps = parsePyImports("from OpenSSL import SSL\nimport win32api");
  assert.deepEqual(deps.map(d => d.name).sort(), ["pyOpenSSL", "pywin32"]);
});
