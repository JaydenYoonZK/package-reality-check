/*! Package Reality Check | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/package-reality-check */
import { extract, verdict, registryUrls } from "./checker.js?v=1.8.5";
import { fetchFacts } from "./registry.js?v=1.8.5";

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
    ? ` <a class="doclink" href="${esc(urls.page)}" rel="noopener noreferrer" target="_blank">view</a>` : "";
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
// SMIL animations are not covered by CSS reduced-motion rules, pause them.
function applyReducedMotion() {
  if (reducedMotion.matches) document.querySelectorAll("svg").forEach((el) => el.pauseAnimations?.());
  else document.querySelectorAll("svg").forEach((el) => el.unpauseAnimations?.());
}
applyReducedMotion();
reducedMotion.addEventListener?.("change", applyReducedMotion);
if (toTop) {
  addEventListener("scroll", () => {
    toTop.classList.toggle("show", scrollY > 600);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" }));
}

// -------- sponsor button magic (sparkle rim + floating hearts) --------
// The tooltip bubble itself is pure CSS; this builds the sparkle layer sized
// to the bubble's real box and streams hearts while a mouse hovers. Reduced
// motion skips all of it, touch never sees it, keyboard focus gets sparkles.
const sponsorBtn = document.querySelector(".sponsor-btn");
if (sponsorBtn && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const HEART_PATH = "M12 21s-6.7-4.35-9.33-8.11C.8 10.2 1.96 6.5 5.14 5.44c1.9-.63 3.98.03 5.36 1.6L12 8.6l1.5-1.56c1.38-1.57 3.46-2.23 5.36-1.6 3.18 1.06 4.34 4.76 2.47 7.45C18.7 16.65 12 21 12 21z";
  const SPARKS = ["✦", "✧", "⋆"];
  const SPARK_TINTS = ["", "var(--spk-b)", "var(--spk-c)"];
  let fx = null, heartTimer = 0, liveHearts = 0;
  const buildFx = () => {
    if (fx) return;
    const tip = getComputedStyle(sponsorBtn, "::after");
    // computed width/height are the content box; the visible bubble adds
    // padding and the gradient keyline, so include them or the stars hug a
    // box smaller than what the eye sees
    const pad = (p) => parseFloat(tip[p]) || 0;
    const w = (parseFloat(tip.width) || 122) + pad("paddingLeft") + pad("paddingRight") + 2;
    const h = (parseFloat(tip.height) || 18) + pad("paddingTop") + pad("paddingBottom") + 2;
    fx = document.createElement("span");
    fx.className = "sponsor-fx";
    fx.setAttribute("aria-hidden", "true");
    fx.style.width = w + "px";
    fx.style.height = h + "px";
    // eight stars parked around the bubble's rim, each on its own phase
    const spots = [[-38, 4], [-30, 34], [-42, 68], [10, 102], [62, 96], [108, 74], [116, 30], [96, -5]];
    spots.forEach(([top, left], k) => {
      const s = document.createElement("span");
      s.className = "spk";
      s.textContent = SPARKS[k % SPARKS.length];
      s.style.top = top + "%";
      s.style.left = left + "%";
      s.style.fontSize = (9 + ((k * 5) % 6)) + "px";
      s.style.animationDelay = (-k * 0.21).toFixed(2) + "s";
      s.style.animationDuration = (1.5 + (k % 3) * 0.35).toFixed(2) + "s";
      if (SPARK_TINTS[k % 3]) s.style.color = SPARK_TINTS[k % 3];
      fx.appendChild(s);
    });
    sponsorBtn.appendChild(fx);
  };
  const spawnHeart = () => {
    if (liveHearts >= 7 || document.hidden) return;
    liveHearts++;
    const el = document.createElement("span");
    el.className = "sponsor-heart";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--hx", (Math.random() * 44 - 22).toFixed(0) + "px");
    el.style.setProperty("--hd", (1.05 + Math.random() * 0.7).toFixed(2) + "s");
    el.style.setProperty("--hs", (0.7 + Math.random() * 0.7).toFixed(2));
    el.style.setProperty("--hr", (Math.random() * 40 - 20).toFixed(0) + "deg");
    if (Math.random() < 0.33) el.style.color = "#ff9ed2";
    el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART_PATH}"/></svg>`;
    el.addEventListener("animationend", () => { el.remove(); liveHearts--; });
    sponsorBtn.appendChild(el);
  };
  sponsorBtn.addEventListener("pointerenter", (e) => {
    buildFx();
    if (e.pointerType === "mouse") {
      spawnHeart();
      clearInterval(heartTimer);
      heartTimer = setInterval(spawnHeart, 300);
    }
  });
  sponsorBtn.addEventListener("pointerleave", () => { clearInterval(heartTimer); heartTimer = 0; });
  sponsorBtn.addEventListener("focus", buildFx);
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f6f4ee" : "#0d0c0a");
      try { localStorage.setItem("theme", next); } catch { /* storage may be blocked */ }
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f6f4ee" : "#0d0c0a");
  try { localStorage.setItem("theme", next); } catch { /* storage may be blocked */ }
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
// Short trailing sections pile into the final screen, where the page can no
// longer scroll each heading up to the line, so position alone cannot tell them
// apart at the bottom. Remember the clicked link and honor it while parked at
// the bottom; a real scroll (wheel or touch) clears it and the line takes over.
let clickedHash = null;
for (const a of navAnchors) if (a.hash) a.addEventListener("click", () => { clickedHash = a.hash; });
addEventListener("wheel", () => { clickedHash = null; }, { passive: true });
addEventListener("touchmove", () => { clickedHash = null; }, { passive: true });
function syncActiveLink() {
  const nav = document.querySelector(".site-nav");
  const line = (nav ? nav.offsetHeight : 0) + 40;
  let current = null;
  for (const sec of navSections) {
    if (sec.getBoundingClientRect().top <= line) current = sec;
  }
  // At the very bottom the last section is current even when the page is too
  // short to lift its heading up to the line, unless the reader clicked one of
  // the piled-up trailing links, in which case honor that.
  if (navSections.length && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
    current = (clickedHash && navSections.find((s) => "#" + s.id === clickedHash)) || navSections[navSections.length - 1];
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

// Cursor dust: tiny chartreuse sparks trail the pointer and burn out about
// a second after it rests. Everything lives on one fixed canvas: spawning
// is distance-based so speed sets density, the animation loop stops the
// moment the last spark dies, and touch or reduced-motion visitors never
// pay for any of it.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // width/height 100% is load-bearing: a canvas is a replaced element, so
  // inset alone does not stretch it and it would lay out at its intrinsic
  // dpr-scaled size, drawing every spark dpr times too far from the cursor.
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:2100;pointer-events:none;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  // One pre-rendered glow sprite per theme: drawImage per spark is far
  // cheaper than building a fresh radial gradient every frame.
  const sprite = (core) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const halo = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    halo.addColorStop(0, "rgba(171, 207, 55, 0.55)");
    halo.addColorStop(0.4, "rgba(171, 207, 55, 0.16)");
    halo.addColorStop(1, "rgba(171, 207, 55, 0)");
    g.fillStyle = halo;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = core;
    g.beginPath();
    g.arc(32, 32, 4.5, 0, 7);
    g.fill();
    return c;
  };
  // The pale core glows against the night theme; light mode gets a deeper
  // green core so the dust stays visible on cream.
  const dust = { dark: sprite("#d7ef7a"), light: sprite("#7e9c26") };

  const sparks = [];
  const MAX = 90;
  let raf = 0, prev = 0, lastX = -1, lastY = -1, carry = 0;

  const spawn = (x, y, dx, dy) => {
    if (sparks.length >= MAX) return;
    const a = Math.random() * Math.PI * 2;
    const push = 4 + Math.random() * 16;
    sparks.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(a) * push + dx * 1.4,
      vy: Math.sin(a) * push + dy * 1.4,
      life: 0,
      ttl: 0.45 + Math.random() * 0.5,
      r: 5 + Math.random() * 9,
      star: Math.random() < 0.25,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 4,
      seed: Math.random() * 40
    });
  };

  const star = (R) => {
    ctx.beginPath();
    ctx.moveTo(0, -R);
    ctx.quadraticCurveTo(R * 0.16, -R * 0.16, R, 0);
    ctx.quadraticCurveTo(R * 0.16, R * 0.16, 0, R);
    ctx.quadraticCurveTo(-R * 0.16, R * 0.16, -R, 0);
    ctx.quadraticCurveTo(-R * 0.16, -R * 0.16, 0, -R);
    ctx.fill();
  };

  const tick = (now) => {
    const t = now / 1000;
    const dt = Math.min(0.05, prev ? t - prev : 0.016);
    prev = t;
    ctx.clearRect(0, 0, w, h);
    const light = document.documentElement.dataset.theme === "light";
    const img = light ? dust.light : dust.dark;
    ctx.fillStyle = light ? "#7e9c26" : "#d7ef7a";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.ttl) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.9;
      s.vy = s.vy * 0.9 + 26 * dt; // the dust settles gently
      const k = 1 - s.life / s.ttl;
      const twinkle = 0.7 + 0.3 * Math.sin(t * 16 + s.seed);
      ctx.globalAlpha = k * k * twinkle;
      const R = s.r * (0.5 + 0.7 * k);
      ctx.drawImage(img, s.x - R, s.y - R, R * 2, R * 2);
      if (s.star) {
        s.rot += s.spin * dt;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        star(R * 0.9);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (sparks.length) raf = requestAnimationFrame(tick);
    else { raf = 0; prev = 0; ctx.clearRect(0, 0, w, h); }
  };

  addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    carry += Math.hypot(dx, dy);
    while (carry > 10) {
      carry -= 10;
      spawn(e.clientX, e.clientY, dx, dy);
    }
    if (sparks.length && !raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();


// Offline support: a small service worker caches the page shell so the
// tool opens without a connection after the first visit.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
  });
}

console.info(
  "%cBuilt by Jayden Yoon ZK%c https://github.com/JaydenYoonZK",
  "background:#abcf37;color:#101400;font-weight:700;padding:2px 8px;border-radius:999px",
  "color:inherit"
);

// The footer's copyright year keeps itself current.
const yearEl = document.getElementById("copyright-year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// FAQ accordions: the button carries the disclosure state, so keyboard
// and screen reader users get the expand and collapse for free.
document.querySelectorAll(".faq-q button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});

// Terminal section: copy a command with one press.
document.querySelectorAll(".cli-copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const code = btn.closest(".cli-card")?.querySelector("code");
    if (!code) return;
    try { await navigator.clipboard.writeText(code.textContent.trim()); } catch { return; }
    const label = btn.textContent;
    btn.textContent = "Copied \u2713";
    setTimeout(() => { btn.textContent = label; }, 1400);
  });
});
