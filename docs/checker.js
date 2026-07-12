/*! Package Reality Check | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/package-reality-check */
/**
 * package-reality-check engine
 *
 * Pure functions only: input parsing, name normalization, stdlib and
 * builtin filtering, typo distance, and verdict logic. Network calls
 * live in app.js so this module runs unchanged under Node's test runner.
 */

// Node.js built-in modules. Imports of these never touch the npm registry.
export const NODE_BUILTINS = new Set([
  "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
  "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
  "events", "fs", "http", "http2", "https", "inspector", "module", "net",
  "os", "path", "perf_hooks", "process", "punycode", "querystring",
  "readline", "repl", "stream", "string_decoder", "sys", "test", "timers",
  "tls", "trace_events", "tty", "url", "util", "v8", "vm", "wasi",
  "worker_threads", "zlib"
]);

// Python standard library (generated from sys.stdlib_module_names on
// CPython 3.14), plus modules removed in recent versions that older
// code still imports. Update with scripts in CONTRIBUTING.md.
export const PY_STDLIB = new Set([
  "__future__","abc","annotationlib","antigravity","argparse","array","ast",
  "asyncio","atexit","base64","bdb","binascii","bisect","builtins","bz2",
  "cProfile","calendar","cmath","cmd","code","codecs","codeop","collections",
  "colorsys","compileall","compression","concurrent","configparser",
  "contextlib","contextvars","copy","copyreg","csv","ctypes","curses",
  "dataclasses","datetime","dbm","decimal","difflib","dis","doctest","email",
  "encodings","ensurepip","enum","errno","faulthandler","fcntl","filecmp",
  "fileinput","fnmatch","fractions","ftplib","functools","gc","genericpath",
  "getopt","getpass","gettext","glob","graphlib","grp","gzip","hashlib",
  "heapq","hmac","html","http","idlelib","imaplib","importlib","inspect",
  "io","ipaddress","itertools","json","keyword","linecache","locale",
  "logging","lzma","mailbox","marshal","math","mimetypes","mmap",
  "modulefinder","msvcrt","multiprocessing","netrc","nt","ntpath",
  "nturl2path","numbers","opcode","operator","optparse","os","pathlib","pdb",
  "pickle","pickletools","pkgutil","platform","plistlib","poplib","posix",
  "posixpath","pprint","profile","pstats","pty","pwd","py_compile","pyclbr",
  "pydoc","pydoc_data","pyexpat","queue","quopri","random","re","readline",
  "reprlib","resource","rlcompleter","runpy","sched","secrets","select",
  "selectors","shelve","shlex","shutil","signal","site","smtplib","socket",
  "socketserver","sqlite3","sre_compile","sre_constants","sre_parse","ssl",
  "stat","statistics","string","stringprep","struct","subprocess","symtable",
  "sys","sysconfig","syslog","tabnanny","tarfile","tempfile","termios",
  "textwrap","this","threading","time","timeit","tkinter","token","tokenize",
  "tomllib","trace","traceback","tracemalloc","tty","turtle","turtledemo",
  "types","typing","unicodedata","unittest","urllib","uuid","venv",
  "warnings","wave","weakref","webbrowser","winreg","winsound","wsgiref",
  "xml","xmlrpc","zipapp","zipfile","zipimport","zlib","zoneinfo",
  // Removed from CPython in 3.12/3.13 but present in older codebases.
  "aifc","asynchat","asyncore","audioop","cgi","cgitb","chunk","crypt",
  "distutils","imghdr","imp","lib2to3","mailcap","msilib","nis","nntplib",
  "ossaudiodev","pipes","smtpd","sndhdr","spwd","sunau","telnetlib","uu",
  "xdrlib"
]);

// Widely used packages, used only for lookalike (typosquat) hints.
export const POPULAR_NPM = [
  "react","react-dom","lodash","express","axios","chalk","commander","next",
  "vue","svelte","typescript","webpack","vite","jest","vitest","mocha",
  "eslint","prettier","moment","dayjs","date-fns","uuid","dotenv","cors",
  "body-parser","mongoose","sequelize","prisma","pg","mysql2","sqlite3",
  "redis","ioredis","socket.io","ws","jsonwebtoken","bcrypt","bcryptjs",
  "passport","zod","yup","joi","node-fetch","got","undici","cheerio",
  "puppeteer","playwright","fs-extra","glob","rimraf","mkdirp","semver",
  "minimist","yargs","inquirer","ora","debug","winston","pino","morgan",
  "nodemon","concurrently","cross-env","esbuild","rollup","tailwindcss",
  "postcss","autoprefixer","sass","styled-components","framer-motion",
  "three","d3","chart.js","echarts","leaflet","stripe","openai",
  "@anthropic-ai/sdk","langchain","@supabase/supabase-js","firebase",
  "aws-sdk","@aws-sdk/client-s3","graphql","apollo-server","@apollo/client",
  "react-router-dom","react-query","@tanstack/react-query","redux",
  "@reduxjs/toolkit","zustand","immer","classnames","clsx","nanoid",
  "validator","sharp","multer","helmet","compression","express-rate-limit",
  "nodemailer","handlebars","ejs","pug","marked","highlight.js","katex",
  "pdfkit","jspdf","xlsx","csv-parse","papaparse","form-data","mime-types",
  "qs","cookie-parser","express-session","connect-redis","http-proxy-middleware"
];

export const POPULAR_PYPI = [
  "requests","numpy","pandas","flask","django","fastapi","pydantic",
  "sqlalchemy","boto3","botocore","urllib3","certifi","idna",
  "charset-normalizer","setuptools","wheel","pip","pytest","tox","black",
  "flake8","mypy","ruff","isort","click","typer","rich","tqdm","pillow",
  "matplotlib","seaborn","scipy","scikit-learn","tensorflow","torch",
  "keras","transformers","openai","anthropic","langchain","httpx","aiohttp",
  "websockets","celery","redis","pymongo","psycopg2","psycopg2-binary",
  "mysqlclient","pymysql","cryptography","pyjwt","bcrypt","passlib",
  "python-dotenv","pyyaml","toml","jinja2","markupsafe","werkzeug",
  "gunicorn","uvicorn","starlette","alembic","marshmallow","attrs","orjson",
  "ujson","simplejson","beautifulsoup4","lxml","html5lib","selenium",
  "playwright","scrapy","twisted","paramiko","fabric","invoke","watchdog",
  "schedule","apscheduler","arrow","pendulum","python-dateutil","pytz",
  "tzdata","regex","chardet","colorama","termcolor","tabulate",
  "prettytable","fire","virtualenv","pipenv","poetry","python-multipart",
  "email-validator","faker","factory-boy","coverage","hypothesis","moto",
  "responses","freezegun","stripe","twilio","sendgrid","jsonschema",
  "packaging","typing-extensions","six","python-slugify","unidecode",
  "openpyxl","xlrd","python-docx","reportlab","pypdf","pdfminer-six"
];

/** PEP 503 name normalization: case-insensitive, -, _, . equivalent. */
export function normalizePypi(name) {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

// A single package-name segment: starts and ends alphanumeric, with dots,
// underscores, and hyphens allowed inside. Rejects slashes, spaces, query and
// fragment characters, and anything else that has no place in a name.
const NAME_SEGMENT = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

/**
 * Is this a plausibly real package name, as opposed to a path, URL, or an
 * injection attempt? A dependency name comes from an untrusted manifest and is
 * placed into a registry URL, so `../../-/npm/v1/...`, `foo?x=1`, `foo#frag`,
 * or a name with spaces must never be sent to the registry verbatim. Names
 * that fail this are treated as invalid rather than looked up.
 */
export function isValidPackageName(name, ecosystem) {
  const s = String(name);
  if (!s || s.length > 214 || s.includes("..")) return false;
  if (ecosystem === "npm" && s.startsWith("@")) {
    const slash = s.indexOf("/");
    if (slash < 1) return false;
    return NAME_SEGMENT.test(s.slice(1, slash)) && NAME_SEGMENT.test(s.slice(slash + 1));
  }
  return NAME_SEGMENT.test(s);
}

/**
 * Optimal string alignment (restricted Damerau-Levenshtein) distance with an
 * early exit above `max`. Counts insert, delete, substitute, and, crucially,
 * an adjacent transposition as ONE edit. Plain Levenshtein scores a swap as
 * two edits, which let the most common real-world typo (two keys hit in the
 * wrong order: "raect", "veu") slip past the tight limits used for short
 * names. Typosquatters know this pattern better than anyone.
 */
export function editDistance(a, b, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null;                                        // row i-2, for transpositions
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1);
    cur[0] = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prev2[j - 2] + 1);                 // adjacent swap costs 1
      }
      cur[j] = d;
      if (d < rowMin) rowMin = d;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** Nearest popular package within a sane typo distance, or null. */
export function lookalikeOf(name, ecosystem) {
  const pool = ecosystem === "pypi" ? POPULAR_PYPI : POPULAR_NPM;
  const n = ecosystem === "pypi" ? normalizePypi(name) : name.toLowerCase();
  let best = null;
  let bestDist = Infinity;
  for (const p of pool) {
    const target = ecosystem === "pypi" ? normalizePypi(p) : p.toLowerCase();
    if (target === n) return null; // it IS the popular package
    const limit = target.length >= 6 ? 2 : 1;
    const d = editDistance(n, target, limit);
    if (d <= limit && d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

/* ---------------- input parsing ---------------- */

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = item.ecosystem + ":" + item.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Given a package.json dependency name and version spec, return the npm
 * registry name to check, or null when the dependency does not come from
 * the registry (a local path, workspace, git, or tarball reference) and so
 * must not be looked up. Resolves `npm:` aliases to their real target.
 *
 * A real registry version spec (semver, range, tag, or "*") never contains
 * a protocol prefix or a slash, which makes the non-registry cases easy to
 * exclude and keeps monorepos from lighting up with false phantoms.
 */
export function resolveNpmDep(name, spec) {
  const s = String(spec ?? "").trim();
  if (s.startsWith("npm:")) {
    let target = s.slice(4);
    if (target.startsWith("@")) {
      const at = target.indexOf("@", 1);
      target = at === -1 ? target : target.slice(0, at);
    } else {
      const at = target.indexOf("@");
      target = at <= 0 ? target : target.slice(0, at);
    }
    return target || null;
  }
  if (/^(file:|link:|workspace:|portal:|git\+|git:|github:|gitlab:|bitbucket:|https?:|ssh:|patch:)/i.test(s)) return null;
  if (s.includes("/")) return null; // local path or "owner/repo" github shorthand
  return name;
}

export function parsePackageJson(text) {
  const pkg = JSON.parse(text);
  // A package.json must be a JSON object. null, an array, or a bare scalar is
  // not a valid manifest; throw so the caller can flag it, rather than
  // silently reporting zero dependencies (a false clean bill of health).
  if (pkg === null || typeof pkg !== "object" || Array.isArray(pkg)) {
    throw new Error("package.json is not a JSON object");
  }
  const out = [];
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const block = pkg[field];
    // A dependency block must be a plain object of name -> spec. A malformed
    // manifest that sets it to a string or array would otherwise yield junk
    // names ("0", "1", ...) from Object.entries, so ignore anything else.
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    for (const [name, spec] of Object.entries(block)) {
      const target = resolveNpmDep(name, spec);
      if (!target) continue;
      out.push({ name: target, ecosystem: "npm", spec, source: field, ...(target !== name ? { alias: name } : {}) });
    }
  }
  return dedupe(out);
}

export function parseRequirements(text) {
  const out = [];
  for (let raw of text.split(/\r?\n/)) {
    let line = raw.replace(/(^|\s)#.*$/, "").trim();
    if (!line || line.startsWith("-")) continue;      // options like -r, --hash
    if (/^(git\+|https?:|file:)/i.test(line)) continue; // direct URLs
    line = line.split(";")[0].trim();                  // environment markers
    const m = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/);
    if (!m) continue;
    out.push({ name: m[1], ecosystem: "pypi", spec: line.slice(m[1].length).trim(), source: "requirements" });
  }
  return dedupe(out);
}

// Matches `import X from "pkg"`, `import "pkg"`, `import("pkg")`, and
// `require("pkg")`. The clause between `import`/`export` and `from` is a
// BOUNDED, negated class ([^"'] can span lines but never a quote, capped at
// 4000 chars). This is deliberate: an earlier version used [\w${},*\s]+\s+from,
// where \s overlapped both quantifiers and produced catastrophic backtracking
// (a file with `import` + whitespace + `from` and no quote could hang forever).
// A negated class with a single bounded quantifier cannot backtrack that way.
/**
 * Extract PyPI dependencies from a pyproject.toml. Handles the three layouts
 * seen in real projects, without needing a TOML library:
 *   [project]                        dependencies = ["requests>=2.31", ...]   (PEP 621)
 *   [project.optional-dependencies]  dev = ["pytest", ...]
 *   [build-system]                   requires = ["setuptools>=61", ...]
 *   [tool.poetry.dependencies]       requests = "^2.31"                        (Poetry)
 *   [tool.poetry.group.X.dependencies], [tool.poetry.dev-dependencies]
 * A small character scanner tracks quotes and bracket depth so that brackets
 * inside requirement strings ("uvicorn[standard]>=0.29") and # comments are
 * handled correctly. Requirement strings reuse the requirements.txt parser.
 */
export function parsePyproject(text) {
  const out = [];
  const push = (reqLine) => {
    for (const d of parseRequirements(reqLine)) out.push({ ...d, source: "pyproject" });
  };

  let table = "";
  let depth = 0;            // bracket depth of an open array value
  let collecting = false;   // inside an array whose strings are requirements
  const POETRY_DEPS = /^tool\.poetry(\.group\.[A-Za-z0-9._-]+)?\.(dev-)?dependencies$/;

  for (const raw of String(text).split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // A table header only counts outside an open array.
    if (depth === 0 && !collecting) {
      const h = trimmed.match(/^\[\[?\s*([^\]]+?)\s*\]\]?$/);
      if (h) { table = h[1].replace(/["']/g, ""); continue; }
    }

    // Decide whether an array starting on this line holds requirement strings.
    if (depth === 0) {
      const key = trimmed.match(/^("?)([A-Za-z0-9._-]+)\1\s*=\s*(.*)$/);
      if (key) {
        const wantArray =
          (table === "project" && key[2] === "dependencies") ||
          (table === "build-system" && key[2] === "requires") ||
          table === "project.optional-dependencies";
        if (wantArray && key[3].startsWith("[")) collecting = true;
        else if (POETRY_DEPS.test(table) && key[2].toLowerCase() !== "python") {
          out.push({ name: key[2], ecosystem: "pypi", spec: "", source: "pyproject" });
          continue; // a Poetry value is a version or inline table, not a requirement string
        }
      }
    }

    // Scan the line: collect quoted strings, track depth, stop at comments.
    let inStr = false, quote = "", buf = "";
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inStr) {
        if (ch === "\\" && quote === '"') { buf += raw[++i] ?? ""; continue; }
        if (ch === quote) { inStr = false; if (collecting && depth > 0) push(buf); buf = ""; }
        else buf += ch;
      } else if (ch === '"' || ch === "'") { inStr = true; quote = ch; buf = ""; }
      else if (ch === "#") break;
      else if (ch === "[") depth++;
      else if (ch === "]") { depth = Math.max(0, depth - 1); if (depth === 0) collecting = false; }
    }
  }
  return dedupe(out);
}

const PY_IMPORT = /^[ \t]*(?:import[ \t]+([^#\n]+)|from[ \t]+([.\w]+)[ \t]+import\b)/gm;
const MAX_IMPORT_SCAN = 4000;
const isIdent = (ch) => /[A-Za-z0-9_$]/.test(ch ?? "");

// Python import names do not always match their PyPI distributions. Keep this
// list deliberately small: every entry must be a stable, widely documented
// mapping rather than a guess about which distribution provides a namespace.
export const PY_IMPORT_DISTRIBUTIONS = Object.freeze({
  PIL: "Pillow",
  bs4: "beautifulsoup4",
  cv2: "opencv-python",
  dateutil: "python-dateutil",
  dotenv: "python-dotenv",
  sklearn: "scikit-learn",
  yaml: "PyYAML"
});

function prevNonSpace(code, i) {
  for (let j = i - 1; j >= 0; j--) {
    if (!/\s/.test(code[j])) return code[j];
  }
  return "";
}

function isWordAt(code, i, word) {
  return code.startsWith(word, i) && !isIdent(code[i - 1]) && !isIdent(code[i + word.length]);
}

function skipString(code, i, quote) {
  for (let j = i + 1; j < code.length; j++) {
    if (code[j] === "\\") { j++; continue; }
    if (code[j] === quote) return j + 1;
  }
  return code.length;
}

function skipLineComment(code, i) {
  const end = code.indexOf("\n", i + 2);
  return end === -1 ? code.length : end + 1;
}

function skipBlockComment(code, i) {
  const end = code.indexOf("*/", i + 2);
  return end === -1 ? code.length : end + 2;
}

function looksLikeRegexStart(code, i) {
  const prev = prevNonSpace(code, i);
  return !prev || /[=(:,[!&|?{};]/.test(prev);
}

function skipRegex(code, i) {
  let inClass = false;
  for (let j = i + 1; j < code.length; j++) {
    const ch = code[j];
    if (ch === "\\") { j++; continue; }
    if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass) {
      while (/[a-z]/i.test(code[j + 1] ?? "")) j++;
      return j + 1;
    } else if (ch === "\n") {
      return j;
    }
  }
  return code.length;
}

function skipIgnorable(code, i) {
  const ch = code[i];
  const next = code[i + 1];
  if (ch === '"' || ch === "'" || ch === "`") return skipString(code, i, ch);
  if (ch === "/" && next === "/") return skipLineComment(code, i);
  if (ch === "/" && next === "*") return skipBlockComment(code, i);
  if (ch === "/" && looksLikeRegexStart(code, i)) return skipRegex(code, i);
  return i;
}

function skipWs(code, i) {
  while (/\s/.test(code[i] ?? "")) i++;
  return i;
}

function readQuoted(code, i) {
  i = skipWs(code, i);
  const quote = code[i];
  if (quote !== '"' && quote !== "'") return null;
  let value = "";
  for (let j = i + 1; j < code.length; j++) {
    const ch = code[j];
    if (ch === "\\") {
      value += code[j + 1] ?? "";
      j++;
      continue;
    }
    if (ch === quote) return { value, end: j + 1 };
    value += ch;
  }
  return null;
}

function readFromSpecifier(code, i) {
  const end = Math.min(code.length, i + MAX_IMPORT_SCAN);
  for (let j = i; j < end; j++) {
    const skipped = skipIgnorable(code, j);
    if (skipped !== j) { j = skipped - 1; continue; }
    if (isWordAt(code, j, "from")) return readQuoted(code, j + 4);
  }
  return null;
}

export function parseJsImports(code) {
  const out = [];
  const addSpec = (spec) => {
    if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("#")) return;
    if (spec.startsWith("node:")) return;
    if (/^(https?|npm|jsr|data):/.test(spec)) return;
    // Reduce deep imports to the package name; scoped keep two segments.
    const parts = spec.split("/");
    const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
    if (!name || NODE_BUILTINS.has(name) || !isValidPackageName(name, "npm")) return;
    out.push({ name, ecosystem: "npm", spec: "", source: "import" });
  };

  for (let i = 0; i < code.length; i++) {
    const skipped = skipIgnorable(code, i);
    if (skipped !== i) { i = skipped - 1; continue; }

    if (isWordAt(code, i, "require") && prevNonSpace(code, i) !== ".") {
      let j = skipWs(code, i + "require".length);
      if (code[j] === "(") {
        const q = readQuoted(code, j + 1);
        if (q) addSpec(q.value);
      }
      continue;
    }

    if (isWordAt(code, i, "import") && prevNonSpace(code, i) !== ".") {
      let j = skipWs(code, i + "import".length);
      if (code[j] === "(") {
        const q = readQuoted(code, j + 1);
        if (q) addSpec(q.value);
      } else if (code[j] === '"' || code[j] === "'") {
        const q = readQuoted(code, j);
        if (q) addSpec(q.value);
      } else {
        const q = readFromSpecifier(code, j);
        if (q) addSpec(q.value);
      }
      continue;
    }

    if (isWordAt(code, i, "export")) {
      const q = readFromSpecifier(code, i + "export".length);
      if (q) addSpec(q.value);
    }
  }
  return dedupe(out);
}

// Mask Python strings and comments while preserving newlines and character
// positions. This keeps import examples in docstrings from becoming package
// findings without needing a Python runtime in the browser.
function maskPythonLiterals(code) {
  let out = "";
  let quote = "";
  let triple = false;
  let comment = false;
  const blank = (ch) => ch === "\n" ? "\n" : " ";

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (comment) {
      out += blank(ch);
      if (ch === "\n") comment = false;
      continue;
    }
    if (quote) {
      if (ch === "\\") {
        out += " ";
        if (i + 1 < code.length) out += blank(code[++i]);
        continue;
      }
      if (triple && code.startsWith(quote.repeat(3), i)) {
        out += "   ";
        i += 2;
        quote = "";
        triple = false;
        continue;
      }
      out += blank(ch);
      if (!triple && ch === quote) quote = "";
      continue;
    }
    if (ch === "#") {
      comment = true;
      out += " ";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      triple = code.startsWith(ch.repeat(3), i);
      out += triple ? "   " : " ";
      if (triple) i += 2;
      continue;
    }
    out += ch;
  }
  return out;
}

export function parsePyImports(code) {
  const out = [];
  for (const m of maskPythonLiterals(String(code)).matchAll(PY_IMPORT)) {
    const names = m[1] ? m[1].split(",") : [m[2]];
    for (const raw of names) {
      const match = raw.trim().match(/^([A-Za-z_]\w*(?:\.\w+)*)/);
      if (!match) continue;
      const imported = match[1].split(".")[0];
      if (!imported || PY_STDLIB.has(imported)) continue;
      const distribution = PY_IMPORT_DISTRIBUTIONS[imported] || imported;
      out.push({
        name: distribution,
        ecosystem: "pypi",
        spec: "",
        source: "import",
        ...(distribution !== imported ? { alias: imported } : {})
      });
    }
  }
  return dedupe(out);
}

/** Guess what was pasted and extract dependencies from it. */
export function extract(text) {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "empty", deps: [] };

  if (trimmed.startsWith("{")) {
    try {
      const deps = parsePackageJson(trimmed);
      return { kind: "package.json", deps };
    } catch { /* fall through */ }
  }

  // pyproject.toml: recognized by its well-known tables.
  if (/^\s*\[(project(\.|\])|tool\.poetry|build-system)/m.test(text)) {
    const deps = parsePyproject(text);
    if (deps.length) return { kind: "pyproject.toml", deps };
  }

  // Decide which languages are plausibly present before parsing, so a
  // JS line like `import x from "pkg"` is not also read as Python.
  const jsSignal = /(?:\bfrom\s*["']|\brequire\s*\(|\bimport\s*\(|\bexport\s+)/.test(text);
  const pySignal = /^[ \t]*from[ \t]+[\w.]+[ \t]+import\b|^[ \t]*import[ \t]+[\w.]+([ \t]*,[ \t]*[\w.]+)*[ \t]*(#.*)?$/m.test(text);
  const jsDeps = jsSignal || !pySignal ? parseJsImports(text) : [];
  const pyDeps = pySignal ? parsePyImports(text) : [];
  const looksLikeRequirements =
    !/\b(import|require|from)\b/.test(text) &&
    text.split(/\r?\n/).filter(l => l.trim()).every(l =>
      /^([A-Za-z0-9][A-Za-z0-9._-]*)\s*([<>=!~;#[].*)?$|^\s*(#|-)/.test(l.trim()));

  if (looksLikeRequirements) {
    const deps = parseRequirements(text);
    if (deps.length) return { kind: "requirements.txt", deps };
  }
  if (jsDeps.length || pyDeps.length) {
    return {
      kind: jsDeps.length && pyDeps.length ? "mixed code" : jsDeps.length ? "JavaScript code" : "Python code",
      deps: dedupe([...jsDeps, ...pyDeps])
    };
  }
  return { kind: "unknown", deps: [] };
}

/* ---------------- verdicts ---------------- */

export const NEW_PACKAGE_DAYS = 120;
export const LOW_DOWNLOADS = 500;
// Thresholds above which a package is considered established, so a
// resemblance to a popular name is treated as coincidence, not a typosquat.
export const ESTABLISHED_DOWNLOADS = 20000;
export const ESTABLISHED_DAYS = 365;

const OTHER_ECO = { npm: "PyPI", pypi: "npm" };

/** "3 days" / "1 year" / "2 years", correctly singularized. Null-safe. */
function humanAge(ageDays) {
  if (ageDays === null || !Number.isFinite(ageDays)) return null;
  const years = Math.floor(ageDays / 365);
  if (years >= 1) return `${years} year${years === 1 ? "" : "s"}`;
  const days = Math.max(0, ageDays);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Compute a verdict from registry facts.
 * facts: { exists, createdAt?, downloads?, deprecated?, foundIn? }
 * foundIn is set when the package is missing here but exists in the other
 * registry, which usually means the ecosystem was guessed wrong for a bare
 * list rather than the package being invented.
 */
export function verdict(name, ecosystem, facts, now = Date.now()) {
  if (facts.invalid) {
    return {
      level: "phantom",
      title: "Not a valid package name",
      detail: "This is not a name any registry could hold. It looks like a path, a URL, or a typo, so nothing was requested for it. Check the manifest."
    };
  }
  const lookalike = lookalikeOf(name, ecosystem);
  if (!facts.exists) {
    if (facts.foundIn) {
      const here = ecosystem === "npm" ? "npm" : "PyPI";
      const there = OTHER_ECO[ecosystem];
      return {
        level: "warn",
        title: `Real package, but on ${there}, not ${here}`,
        detail: `Not found on ${here}, yet a package with this name exists on ${there}. A bare list of names is checked against one registry at a time; this one looks like it belongs to the other. Paste a package.json, requirements.txt, or pyproject.toml to remove the guesswork.`
      };
    }
    return {
      level: "phantom",
      title: "Not found in the registry",
      detail: lookalike
        ? `No such package. Did you mean "${lookalike}"? If an AI tool suggested this name, it likely invented it.`
        : "No such package. If an AI tool suggested this name, it likely invented it. Do not try to install it blindly: a squatter may register it later."
    };
  }
  // The package exists. A registry "security holding" placeholder means the
  // real package was removed for malware or a serious issue; the name is a
  // tombstone, not something to install. This outranks every other signal.
  if (facts.securityHolding) {
    return {
      level: "danger",
      title: "Replaced by a security placeholder",
      detail: "npm serves this name as an empty \"security holding\" version, a pattern used after package removals and security incidents. Do not install it without reviewing the package history."
    };
  }
  const flags = [];
  let ageDays = null;
  if (facts.createdAt) {
    const parsed = Math.floor((now - new Date(facts.createdAt).getTime()) / 86400000);
    ageDays = Number.isFinite(parsed) ? parsed : null;   // ignore an unparseable timestamp
    if (ageDays !== null && ageDays <= NEW_PACKAGE_DAYS) {
      flags.push(`registered ${ageDays} day${ageDays === 1 ? "" : "s"} ago`);
    }
  }
  if (typeof facts.downloads === "number" && facts.downloads < LOW_DOWNLOADS) {
    flags.push(`${facts.downloads} downloads last month`);
  }
  if (facts.deprecated) flags.push("marked deprecated");

  // An established package that happens to resemble a popular name is not a
  // typosquat: it is a legitimate package that has earned its place. This
  // keeps real packages like "enquirer" or "serve" from being flagged as
  // impostors. Heavy downloads always establish. Age alone establishes only
  // when downloads are not known to be tiny: a name one edit from a popular
  // package that has sat for years with almost no use fits the profile of a
  // parked typosquat, not an adopted library, so it stays flagged.
  const tinyDownloads = typeof facts.downloads === "number" && facts.downloads < LOW_DOWNLOADS;
  const established =
    (typeof facts.downloads === "number" && facts.downloads >= ESTABLISHED_DOWNLOADS) ||
    (ageDays !== null && ageDays > ESTABLISHED_DAYS && !tinyDownloads);
  const suspiciousLookalike = lookalike && !established;

  if (suspiciousLookalike && flags.length) {
    return {
      level: "danger",
      title: `Exists, but looks like a typo of "${lookalike}"`,
      detail: `This package is real but ${flags.join(", ")}. Obscure lookalikes of popular names are the classic squatting pattern. Verify before installing.`
    };
  }
  if (suspiciousLookalike) {
    return {
      level: "warn",
      title: `One edit away from "${lookalike}"`,
      detail: "The package exists, but double-check you did not want the popular one."
    };
  }
  if (flags.length) {
    return {
      level: "warn",
      title: "Exists, worth a closer look",
      detail: flags.join(", ") + ". Young or rarely downloaded packages deserve a quick source review."
    };
  }
  const age = humanAge(ageDays);
  return {
    level: "ok",
    title: "Found",
    detail: age ? `registered ${age} ago` : ""
  };
}

/** Registry endpoints (all CORS-enabled). */
export function registryUrls(name, ecosystem) {
  if (ecosystem === "pypi") {
    const n = normalizePypi(name);
    return {
      api: `https://pypi.org/pypi/${encodeURIComponent(n)}/json`,
      page: `https://pypi.org/project/${encodeURIComponent(n)}/`
    };
  }
  // Always encode: the name is untrusted, and encoding a normal name is a
  // no-op (encodeURIComponent leaves letters, digits, - _ . ~ alone) while a
  // hostile name like "../../x" or "foo?x=1" is neutralized into the path.
  const enc = encodeURIComponent(name);
  return {
    api: `https://registry.npmjs.org/${enc}`,
    latest: `https://registry.npmjs.org/${enc}/latest`,
    downloads: `https://api.npmjs.org/downloads/point/last-month/${enc}`,
    // page is a display link (npmjs.com wants the literal @scope/name); it is
    // only shown for names that already validated, so it carries no injection.
    page: `https://www.npmjs.com/package/${name}`
  };
}
