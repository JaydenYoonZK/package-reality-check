/**
 * phantom-deps engine
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

/** Levenshtein distance with early exit above `max`. */
export function editDistance(a, b, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    let rowMin = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diag = tmp;
      if (prev[j] < rowMin) rowMin = prev[j];
    }
    if (rowMin > max) return max + 1;
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

export function parsePackageJson(text) {
  const pkg = JSON.parse(text);
  const out = [];
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
      out.push({ name, ecosystem: "npm", spec, source: field });
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

const JS_IMPORT = /(?:import\s+(?:[\w${},*\s]+\s+from\s+)?|import\s*\(\s*|require\s*\(\s*|export\s+(?:[\w${},*\s]+\s+)?from\s+)["']([^"']+)["']/g;
const PY_IMPORT = /^[ \t]*(?:import[ \t]+([\w.]+(?:[ \t]*,[ \t]*[\w.]+)*)|from[ \t]+([\w.]+)[ \t]+import)/gm;

export function parseJsImports(code) {
  const out = [];
  for (const m of code.matchAll(JS_IMPORT)) {
    let spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("#")) continue;
    if (spec.startsWith("node:")) continue;
    if (/^(https?|npm|jsr|data):/.test(spec)) continue;
    // Reduce deep imports to the package name; scoped keep two segments.
    const parts = spec.split("/");
    const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
    if (!name || NODE_BUILTINS.has(name)) continue;
    out.push({ name, ecosystem: "npm", spec: "", source: "import" });
  }
  return dedupe(out);
}

export function parsePyImports(code) {
  const out = [];
  for (const m of code.matchAll(PY_IMPORT)) {
    const names = m[1] ? m[1].split(",") : [m[2]];
    for (let n of names) {
      n = n.trim().split(".")[0];
      if (!n || n.startsWith(".")) continue;
      if (PY_STDLIB.has(n)) continue;
      out.push({ name: n, ecosystem: "pypi", spec: "", source: "import" });
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

/**
 * Compute a verdict from registry facts.
 * facts: { exists, createdAt?, downloads?, deprecated? }
 */
export function verdict(name, ecosystem, facts, now = Date.now()) {
  const lookalike = lookalikeOf(name, ecosystem);
  if (!facts.exists) {
    return {
      level: "phantom",
      title: "Not found in the registry",
      detail: lookalike
        ? `No such package. Did you mean "${lookalike}"? If an AI tool suggested this name, it likely invented it.`
        : "No such package. If an AI tool suggested this name, it likely invented it. Do not try to install it blindly: a squatter may register it later."
    };
  }
  const flags = [];
  let ageDays = null;
  if (facts.createdAt) {
    ageDays = Math.floor((now - new Date(facts.createdAt).getTime()) / 86400000);
    if (ageDays <= NEW_PACKAGE_DAYS) flags.push(`registered ${ageDays} days ago`);
  }
  if (typeof facts.downloads === "number" && facts.downloads < LOW_DOWNLOADS) {
    flags.push(`${facts.downloads} downloads last month`);
  }
  if (facts.deprecated) flags.push("marked deprecated");

  if (lookalike && flags.length) {
    return {
      level: "danger",
      title: `Exists, but looks like a typo of "${lookalike}"`,
      detail: `This package is real but ${flags.join(", ")}. New lookalikes of popular names are the classic squatting pattern. Verify before installing.`
    };
  }
  if (lookalike) {
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
  return {
    level: "ok",
    title: "Found",
    detail: ageDays !== null ? `registered ${Math.floor(ageDays / 365) ? Math.floor(ageDays / 365) + " years" : ageDays + " days"} ago` : ""
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
  return {
    api: `https://registry.npmjs.org/${name.startsWith("@") ? encodeURIComponent(name) : name}`,
    downloads: `https://api.npmjs.org/downloads/point/last-month/${name.startsWith("@") ? encodeURIComponent(name) : name}`,
    page: `https://www.npmjs.com/package/${name}`
  };
}
