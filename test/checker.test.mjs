import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extract, parsePackageJson, resolveNpmDep, parseRequirements, parseJsImports, parsePyImports,
  editDistance, lookalikeOf, normalizePypi, verdict, registryUrls
} from "../docs/checker.js";

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

test("edit distance", () => {
  assert.equal(editDistance("requests", "reqeusts"), 2);
  assert.equal(editDistance("lodash", "lodahs"), 2);
  assert.equal(editDistance("react", "react"), 0);
  assert.ok(editDistance("short", "completely-different", 2) > 2);
});

test("lookalike detection catches classic typos", () => {
  assert.equal(lookalikeOf("reqeusts", "pypi"), "requests");
  assert.equal(lookalikeOf("lodahs", "npm"), "lodash");
  assert.equal(lookalikeOf("expresss", "npm"), "express");
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

test("verdict: ok for established package", () => {
  const now = Date.parse("2026-07-07");
  const v = verdict("express", "npm",
    { exists: true, createdAt: "2010-01-01T00:00:00Z", downloads: 9999999 }, now);
  assert.equal(v.level, "ok");
});

test("registry URLs encode scoped and normalized names", () => {
  assert.equal(registryUrls("@scope/pkg", "npm").api,
    "https://registry.npmjs.org/%40scope%2Fpkg");
  assert.equal(registryUrls("Flask_SQLAlchemy", "pypi").api,
    "https://pypi.org/pypi/flask-sqlalchemy/json");
});
