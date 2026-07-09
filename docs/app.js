import { extract, verdict, registryUrls } from "./checker.js";
import { fetchFacts } from "./registry.js";

const $ = (id) => document.getElementById(id);
const input = $("input");
const results = $("results");
const summary = $("summary");
const tbody = $("tbody");
const kindNote = $("kind-note");
const progressBar = $("progress-bar");
const progressWrap = $("progress");
const checkBtn = $("check");
const clearBtn = $("clear");

const MAX_PACKAGES = 200;
const CONCURRENCY = 6;

// Enable Check and Clear only when there is something to act on. With an empty
// box there is nothing to check and nothing to clear, so both are disabled
// (the stylesheet dims them and shows a not-allowed cursor). Check is also
// disabled while a check is running, but Clear stays usable so you can reset
// mid-run. Kept in sync on every input, sample, paste, run, and clear.
let running = false;
function syncControls() {
  const hasContent = input.value.trim().length > 0;
  checkBtn.disabled = running || !hasContent;
  clearBtn.disabled = !hasContent;
}
input.addEventListener("input", syncControls);

// Escape for HTML text and double-quoted attributes (covers & < > " ').
const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// The registry logic (light-then-full fetch, security-holding detection,
// wrong-ecosystem check, name validation, timeouts and retries) lives in the
// shared registry module, so the browser and the CLI stay identical. See
// fetchFacts in registry.js.

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
  // Everything interpolated here is escaped. dep.name and the page URL derive
  // from untrusted input, and level/ecosystem are ours, but all pass through
  // esc() so a rendering change can never reopen an injection path.
  const level = v?.level ?? "checking";
  const badge = `<span class="verdict ${esc(level)}">${esc(LEVEL_LABEL[level] ?? level)}</span>`;
  const title = v?.title ? `<strong>${esc(v.title)}</strong><br>` : "";
  const detail = v ? `${title}<span class="detail">${esc(v.detail || "")}</span>` : `<span class="detail">checking registry...</span>`;
  const link = v?.level && v.level !== "phantom" && v.level !== "checking"
    ? ` <a href="${esc(urls.page)}" rel="noopener noreferrer" target="_blank">view</a>` : "";
  return `<td class="pkg">${esc(dep.name)}<div class="eco">${esc(dep.ecosystem)}${dep.source ? " · " + esc(dep.source) : ""}</div></td>
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
      : "Could not find any dependencies in that input. Paste a package.json, a requirements.txt, a pyproject.toml, or code with imports.";
    progressWrap.hidden = true;
    return;
  }

  const list = deps.slice(0, MAX_PACKAGES);
  results.hidden = false;
  kindNote.textContent = `Detected ${kind}. Checking ${list.length} unique package${list.length === 1 ? "" : "s"} against ${list.some(d => d.ecosystem === "npm") && list.some(d => d.ecosystem === "pypi") ? "npm and PyPI" : list[0].ecosystem === "npm" ? "the npm registry" : "PyPI"}.` +
    (deps.length > MAX_PACKAGES ? ` The first ${MAX_PACKAGES} are checked; split larger lists to stay polite to the registries.` : "");
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  running = true;
  syncControls();

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
      const facts = await fetchFacts(dep);
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
  if (phantoms) chips.push(`<span class="chip red"><strong>${phantoms}</strong> phantom or invalid</span>`);
  if (dangers) chips.push(`<span class="chip red"><strong>${dangers}</strong> dangerous</span>`);
  if (warns) chips.push(`<span class="chip amber"><strong>${warns}</strong> worth a closer look</span>`);
  if (!chips.length) chips.push(`<span class="chip ok"><strong>All ${list.length}</strong> packages check out</span>`);
  summary.innerHTML = chips.join("");
  running = false;
  syncControls();
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

clearBtn.addEventListener("click", () => {
  input.value = "";
  results.hidden = true;
  syncControls();
  input.focus();
});

if (new URLSearchParams(location.search).has("demo")) {
  $("sample-req").click();
}

// Set the initial enabled/disabled state to match the (empty) box on load.
syncControls();

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

const scene = document.querySelector(".bg-scene");
if (scene && matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let rafId = 0;
  addEventListener("mousemove", (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      scene.style.setProperty("--px", (e.clientX / innerWidth - 0.5).toFixed(3));
      scene.style.setProperty("--py", (e.clientY / innerHeight - 0.5).toFixed(3));
    });
  }, { passive: true });
}

if (scene && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let scrollRaf = 0;
  const applyScroll = () => {
    scrollRaf = 0;
    scene.style.setProperty("--sy", String(scrollY));
  };
  addEventListener("scroll", () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll);
  }, { passive: true });
  applyScroll();
}
