import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, "docs");
const html = readFileSync(join(docs, "index.html"), "utf8");
const app = readFileSync(join(docs, "app.js"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("interactive controls have accessible names", () => {
  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const aria = match[1].match(/\baria-label="([^"]+)"/i)?.[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    assert.ok(aria || text, `button has no accessible name: ${match[0]}`);
  }
  assert.match(html, /<label for="input"[^>]*>[^<]+<\/label>/);
});

test("internal targets and local page assets exist", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `missing #${match[1]}`);
  }
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  const local = references.filter(value => !/^(?:[a-z]+:|#)/i.test(value) && !value.startsWith("//"));
  for (const reference of local) {
    const path = reference.split(/[?#]/, 1)[0];
    assert.ok(existsSync(join(docs, path)), `missing local asset: ${reference}`);
  }
});

test("security and structured metadata match the release", () => {
  assert.match(html, /default-src 'none'/);
  assert.match(html, /connect-src https:\/\/registry\.npmjs\.org https:\/\/api\.npmjs\.org https:\/\/pypi\.org/);
  assert.match(html, /base-uri 'none'/);
  assert.match(html, /form-action 'none'/);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLd, "missing JSON-LD metadata");
  const metadata = JSON.parse(jsonLd[1]);
  assert.equal(metadata.softwareVersion, pkg.version);
  assert.match(html, new RegExp(`styles\\.css\\?v=${pkg.version.replaceAll(".", "\\.")}`));
  assert.match(html, new RegExp(`app\\.js\\?v=${pkg.version.replaceAll(".", "\\.")}`));
  assert.match(app, new RegExp(`checker\\.js\\?v=${pkg.version.replaceAll(".", "\\.")}`));
  assert.match(app, new RegExp(`registry\\.js\\?v=${pkg.version.replaceAll(".", "\\.")}`));
});

test("search and social metadata point to the canonical site", () => {
  const robots = readFileSync(join(docs, "robots.txt"), "utf8");
  const sitemap = readFileSync(join(docs, "sitemap.xml"), "utf8");
  assert.match(robots, /Sitemap: https:\/\/jaydenyoonzk\.github\.io\/package-reality-check\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/jaydenyoonzk\.github\.io\/package-reality-check\/<\/loc>/);
  assert.match(html, /<meta property="og:image:alt" content="[^"]+">/);
  assert.match(html, /<meta name="twitter:description" content="[^"]+">/);
});

test("browser checks are superseded safely and report lookup errors", () => {
  assert.match(app, /currentRun !== runId/);
  assert.match(app, /could not be checked/);
  assert.ok(app.indexOf("if (errors)") < app.indexOf("if (!chips.length)"));
});
