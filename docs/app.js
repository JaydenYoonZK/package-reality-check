import { extract, verdict, registryUrls } from "./checker.js";

const $ = (id) => document.getElementById(id);
const input = $("input");
const results = $("results");
const summary = $("summary");
const tbody = $("tbody");
const kindNote = $("kind-note");
const progressBar = $("progress-bar");
const progressWrap = $("progress");
const checkBtn = $("check");

const MAX_PACKAGES = 200;
const CONCURRENCY = 6;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function factsFor(dep) {
  const urls = registryUrls(dep.name, dep.ecosystem);
  try {
    const res = await fetch(urls.api, { headers: { Accept: "application/json" } });
    if (res.status === 404) return { exists: false };
    if (!res.ok) return { error: `registry answered ${res.status}` };
    const json = await res.json();

    if (dep.ecosystem === "npm") {
      const createdAt = json.time?.created ?? null;
      const latest = json["dist-tags"]?.latest;
      const deprecated = Boolean(latest && json.versions?.[latest]?.deprecated);
      let downloads = null;
      try {
        const d = await fetch(urls.downloads);
        if (d.ok) downloads = (await d.json()).downloads ?? null;
      } catch { /* downloads are optional */ }
      return { exists: true, createdAt, downloads, deprecated };
    }

    // PyPI: earliest upload across all releases.
    let earliest = null;
    for (const files of Object.values(json.releases ?? {})) {
      for (const f of files) {
        const t = f.upload_time_iso_8601 || f.upload_time;
        if (t && (!earliest || t < earliest)) earliest = t;
      }
    }
    return { exists: true, createdAt: earliest, downloads: null, deprecated: false };
  } catch {
    return { error: "network error" };
  }
}

const LEVEL_LABEL = {
  phantom: "PHANTOM",
  danger: "DANGER",
  warn: "CHECK",
  ok: "OK",
  checking: "…",
  error: "RETRY"
};
const LEVEL_ORDER = { phantom: 0, danger: 1, warn: 2, error: 3, ok: 4 };

function rowHtml(dep, v, urls) {
  const level = v?.level ?? "checking";
  const badge = `<span class="verdict ${level}">${LEVEL_LABEL[level] ?? level}</span>`;
  const title = v?.title ? `<strong>${esc(v.title)}</strong><br>` : "";
  const detail = v ? `${title}<span class="detail">${esc(v.detail || "")}</span>` : `<span class="detail">checking registry...</span>`;
  const link = v?.level && v.level !== "phantom" && v.level !== "checking"
    ? ` <a href="${urls.page}" rel="noopener" target="_blank">view</a>` : "";
  return `<td class="pkg">${esc(dep.name)}<div class="eco">${dep.ecosystem}${dep.source ? " · " + esc(dep.source) : ""}</div></td>
    <td>${badge}</td><td>${detail}${link}</td>`;
}

async function run() {
  const { kind, deps } = extract(input.value);
  tbody.innerHTML = "";
  summary.innerHTML = "";

  if (!deps.length) {
    results.hidden = false;
    kindNote.textContent = kind === "empty"
      ? "Nothing to check yet."
      : "Could not find any dependencies in that input. Paste a package.json, a requirements.txt, or code with imports.";
    progressWrap.hidden = true;
    return;
  }

  const list = deps.slice(0, MAX_PACKAGES);
  results.hidden = false;
  kindNote.textContent = `Detected ${kind}. Checking ${list.length} unique package${list.length === 1 ? "" : "s"} against ${list.some(d => d.ecosystem === "npm") && list.some(d => d.ecosystem === "pypi") ? "npm and PyPI" : list[0].ecosystem === "npm" ? "the npm registry" : "PyPI"}.` +
    (deps.length > MAX_PACKAGES ? ` The first ${MAX_PACKAGES} are checked; split larger lists to stay polite to the registries.` : "");
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  checkBtn.disabled = true;

  const rows = list.map(dep => {
    const tr = document.createElement("tr");
    tr.innerHTML = rowHtml(dep, null, registryUrls(dep.name, dep.ecosystem));
    tbody.appendChild(tr);
    return tr;
  });

  let done = 0;
  const outcomes = new Array(list.length);
  const queue = list.map((dep, i) => ({ dep, i }));

  async function worker() {
    while (queue.length) {
      const { dep, i } = queue.shift();
      const facts = await factsFor(dep);
      const v = facts.error
        ? { level: "error", title: "Could not check", detail: facts.error + ". Try again in a moment." }
        : verdict(dep.name, dep.ecosystem, facts);
      outcomes[i] = v.level;
      rows[i].innerHTML = rowHtml(dep, v, registryUrls(dep.name, dep.ecosystem));
      done++;
      progressBar.style.width = `${Math.round(done / list.length * 100)}%`;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Order rows by severity once everything is in.
  const indexed = rows.map((tr, i) => ({ tr, level: outcomes[i] ?? "error" }));
  indexed.sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
  for (const { tr } of indexed) tbody.appendChild(tr);

  const count = (lvl) => outcomes.filter(o => o === lvl).length;
  const phantoms = count("phantom");
  const dangers = count("danger");
  const warns = count("warn");
  const chips = [];
  if (phantoms) chips.push(`<span class="chip red"><strong>${phantoms}</strong> phantom (not in any registry)</span>`);
  if (dangers) chips.push(`<span class="chip red"><strong>${dangers}</strong> dangerous lookalike${dangers === 1 ? "" : "s"}</span>`);
  if (warns) chips.push(`<span class="chip amber"><strong>${warns}</strong> worth a closer look</span>`);
  if (!chips.length) chips.push(`<span class="chip ok"><strong>All ${list.length}</strong> packages check out</span>`);
  summary.innerHTML = chips.join("");
  checkBtn.disabled = false;
}

checkBtn.addEventListener("click", run);
input.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
});

$("sample-req").addEventListener("click", () => {
  input.value = [
    "# From an AI-generated setup guide",
    "fastapi==0.111.0",
    "uvicorn[standard]>=0.29",
    "reqeusts",
    "fastapi-jwt-auth-pro-max",
    "pydantic>=2"
  ].join("\n");
  run();
});

$("sample-js").addEventListener("click", () => {
  input.value = [
    '// Imports suggested by a code assistant',
    'import express from "express";',
    'import { merge } from "lodahs";',
    'import { createSecureToken } from "express-jwt-secure-tokens";',
    'import fs from "node:fs";'
  ].join("\n");
  run();
});

const pasteBtn = $("paste");
pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      input.value = text;
      run();
      return;
    }
  } catch { /* permission denied or unsupported */ }
  input.focus();
  const prev = pasteBtn.textContent;
  pasteBtn.textContent = navigator.platform?.includes("Mac") ? "Press \u2318V, then Check" : "Press Ctrl+V, then Check";
  setTimeout(() => { pasteBtn.textContent = prev; }, 2400);
});

$("clear").addEventListener("click", () => {
  input.value = "";
  results.hidden = true;
  input.focus();
});

if (new URLSearchParams(location.search).has("demo")) {
  $("sample-req").click();
}

const toTop = document.getElementById("to-top");
if (toTop) {
  addEventListener("scroll", () => {
    toTop.classList.toggle("show", scrollY > 600);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
}

const themeToggle = document.getElementById("theme-toggle");
function syncThemeIcon() {
  themeToggle.textContent = document.documentElement.dataset.theme === "light" ? "🌙" : "☀️";
}
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  syncThemeIcon();
});
syncThemeIcon();

const navAnchors = [...document.querySelectorAll(".nav-links a")];
const navSections = navAnchors
  .map(a => document.getElementById(a.hash.slice(1)))
  .filter(Boolean);
const sectionSpy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const a of navAnchors) {
      a.classList.toggle("active", a.hash === "#" + entry.target.id);
    }
  }
}, { rootMargin: "-30% 0px -60% 0px" });
navSections.forEach(sec => sectionSpy.observe(sec));
