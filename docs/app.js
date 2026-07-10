import { extract, verdict, registryUrls } from "./checker.js?v=1.7.17";
import { fetchFacts } from "./registry.js?v=1.7.17";

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
let runId = 0;
function syncControls() {
  const hasContent = input.value.trim().length > 0;
  checkBtn.disabled = running || !hasContent;
  clearBtn.disabled = !hasContent;
}
input.addEventListener("input", () => {
  if (running) {
    runId++;
    running = false;
    results.hidden = true;
  }
  syncControls();
});

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
  const currentRun = ++runId;
  running = false;
  syncControls();
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
    while (queue.length && currentRun === runId) {
      const { dep, i } = queue.shift();
      const facts = await fetchFacts(dep);
      if (currentRun !== runId) return;
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
  if (currentRun !== runId) return;

  // Order rows by severity once everything is in.
  const indexed = rows.map((tr, i) => ({ tr, level: outcomes[i] ?? "error" }));
  indexed.sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
  for (const { tr } of indexed) tbody.appendChild(tr);

  const count = (lvl) => outcomes.filter(o => o === lvl).length;
  const phantoms = count("phantom");
  const dangers = count("danger");
  const warns = count("warn");
  const errors = count("error");
  const chips = [];
  if (phantoms) chips.push(`<span class="chip red"><strong>${phantoms}</strong> phantom or invalid</span>`);
  if (dangers) chips.push(`<span class="chip red"><strong>${dangers}</strong> dangerous</span>`);
  if (warns) chips.push(`<span class="chip amber"><strong>${warns}</strong> worth a closer look</span>`);
  if (errors) chips.push(`<span class="chip amber"><strong>${errors}</strong> could not be checked</span>`);
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
    "# From an unverified setup guide",
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
    '// Unverified dependency suggestions',
    'import express from "express";',
    'import { merge } from "lodahs";',
    'import { createSecureToken } from "express-jwt-secure-tokens";',
    'import fs from "node:fs";'
  ].join("\n");
  run();
});

const pasteBtn = $("paste");
const pasteLabel = pasteBtn.textContent;
let pasteFlashTimer = 0;
let waitingForPaste = false;
function flashPaste(msg) {
  pasteBtn.textContent = msg;
  clearTimeout(pasteFlashTimer);
  pasteFlashTimer = setTimeout(() => { pasteBtn.textContent = pasteLabel; }, 2600);
}
pasteBtn.addEventListener("click", async () => {
  // Read the clipboard on every device. On iOS the system shows its Paste
  // confirmation bubble at the tap point; confirming it fills the box and
  // runs the check in one motion. That bubble is the minimum iOS allows
  // before a page may read the clipboard.
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      input.value = text;
      run();
      return;
    }
    flashPaste("Clipboard is empty");
    return;
  } catch { /* declined or unsupported, fall back to a manual paste */ }
  waitingForPaste = true;
  input.focus();
  input.select(); // a manual paste then replaces the old content
  flashPaste(matchMedia("(pointer: coarse)").matches
    ? "Long-press the box, then Paste"
    : (navigator.platform?.includes("Mac") ? "Press \u2318V to paste" : "Press Ctrl+V to paste"));
});
// If the clipboard read was declined, the check still runs the moment a
// manual paste lands in the box.
input.addEventListener("paste", () => {
  if (!waitingForPaste) return;
  waitingForPaste = false;
  clearTimeout(pasteFlashTimer);
  pasteBtn.textContent = pasteLabel;
  setTimeout(run, 0); // let the pasted text land first
});

clearBtn.addEventListener("click", () => {
  runId++;
  running = false;
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
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
if (toTop) {
  addEventListener("scroll", () => {
    toTop.classList.toggle("show", scrollY > 600);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" }));
}

const themeToggle = document.getElementById("theme-toggle");
function syncThemeIcon() {
  const label = document.documentElement.dataset.theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("data-tip", label);
}
let themeFadeTimer = 0;
themeToggle.addEventListener("click", () => {
  // Crossfade the page in one composited pass where the browser supports
  // view transitions; text then cannot re-ease its inherited color and lag
  // behind the page. Elsewhere, fall back to fading only non-inherited
  // colors so text switches in one clean step.
  if (document.startViewTransition) {
    document.documentElement.classList.add("vt-active");
    const vt = document.startViewTransition(() => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("theme", next);
      syncThemeIcon();
    });
    vt.finished.finally(() => document.documentElement.classList.remove("vt-active"));
    return;
  }
  document.documentElement.classList.add("theme-fading");
  clearTimeout(themeFadeTimer);
  themeFadeTimer = setTimeout(() => document.documentElement.classList.remove("theme-fading"), 500);
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  syncThemeIcon();
});
syncThemeIcon();

// Scroll spy: the active menu item is the last section whose heading sits
// at or above the reading line just below the sticky header. Computed from
// the scroll position rather than an IntersectionObserver band, because a
// menu jump lands the heading at the top of the viewport, outside any
// mid-viewport band, which left the highlight stuck on a section the page
// merely scrolled past.
const navAnchors = [...document.querySelectorAll(".nav-links a")];
const navSections = navAnchors.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
navSections.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
function syncActiveLink() {
  const nav = document.querySelector(".site-nav");
  const line = (nav ? nav.offsetHeight : 0) + 40;
  let current = null;
  for (const sec of navSections) {
    if (sec.getBoundingClientRect().top <= line) current = sec;
  }
  // At the very bottom the last section is current even when the page is
  // too short to lift its heading up to the line.
  if (navSections.length && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
    current = navSections[navSections.length - 1];
  }
  for (const a of navAnchors) {
    const on = !!current && a.hash === "#" + current.id;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
}
let spyRaf = 0;
addEventListener("scroll", () => { if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; syncActiveLink(); }); }, { passive: true });
addEventListener("resize", syncActiveLink, { passive: true });
syncActiveLink();

const scene = document.querySelector(".bg-scene");
if (scene && matchMedia("(pointer: fine)").matches && !reducedMotion.matches) {
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

if (scene && !reducedMotion.matches) {
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

// The bar is a brand row plus a menu band, and the band wraps on narrow
// screens, so the anchor offset is measured rather than hardcoded.
const siteNav = document.querySelector(".site-nav");
if (siteNav) {
  const setNavHeight = () => document.documentElement.style.setProperty("--nav-h", siteNav.offsetHeight + "px");
  addEventListener("resize", setNavHeight, { passive: true });
  setNavHeight();
}
