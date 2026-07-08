# Package Reality Check 👻

Check that your dependencies actually exist and are plausibly legitimate. Catches AI-hallucinated (slopsquatted) packages and fresh typosquats **before you install them**, in your CI or your terminal. A zero-dependency CLI and a browser tool.

<p>
  <a href="#cli"><img src="https://img.shields.io/badge/CLI-npx-abcf37?style=for-the-badge&logo=npm&logoColor=black" alt="Run the CLI"></a>
  <a href="https://jaydenyoonzk.github.io/package-reality-check/"><img src="https://img.shields.io/badge/Browser%20tool-open-544741?style=for-the-badge&logo=githubpages&logoColor=white" alt="Open the browser tool"></a>
  <a href="https://github.com/JaydenYoonZK/package-reality-check/stargazers"><img src="https://img.shields.io/github/stars/JaydenYoonZK/package-reality-check?style=for-the-badge&logo=github" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/JaydenYoonZK/package-reality-check?style=for-the-badge" alt="MIT License"></a>
</p>

```console
$ npx github:JaydenYoonZK/package-reality-check

  Package Reality Check  ·  4 packages

  ✗ npm  express-jwt-secure-tokens  PHANTOM  Not found in the registry
       No such package. If an AI tool suggested this name, it likely invented it.
  ! npm  lodahs                     CHECK    One edit away from "lodash"
  ! npm  react-codeshift            CHECK    24 downloads last month, worth a look
  ✓ npm  react                      OK

  1 phantom  ·  2 to review  ·  1 real
  ✗ 1 package could not be trusted. Do not install until you have verified each one.
```

## Why this exists

Code assistants hallucinate package names. A [2024 study of 576,000 generated code samples](https://arxiv.org/abs/2406.10279) found that nearly one in five suggested packages did not exist, across more than 200,000 unique invented names. Because models repeat the same fake names, attackers register them with malicious payloads and wait. The security community calls it **slopsquatting**, and it is not theoretical: in early 2026 the hallucinated package `react-codeshift` was registered and [spread to 237 repositories through AI agent files](https://www.techtimes.com/articles/319457/20260701/ai-coding-agents-skip-package-verification-attackers-are-exploiting-it.htm).

Here is the gap that makes this tool worth having: **a vulnerability scanner cannot flag a package that does not exist yet.** Socket, `npm audit`, and friends check known packages against advisory databases. But the most dangerous moment is when your AI assistant suggests a name that is not on the registry at all, because that is the name a squatter will claim next. Package Reality Check works one layer upstream: it verifies that each dependency is real and established before anything gets installed.

<a id="cli"></a>

## Command line

No install, nothing to trust. It runs from the repo and has **zero dependencies of its own** (a supply-chain tool should not be a supply-chain risk):

```bash
# scan the current project
npx github:JaydenYoonZK/package-reality-check

# scan a specific directory, and also check source-code imports
npx github:JaydenYoonZK/package-reality-check ./my-app --include-code

# machine-readable output for pipelines
npx github:JaydenYoonZK/package-reality-check --json
```

It reads `package.json` (every dependency field) and `requirements.txt`, checks each dependency against the live npm and PyPI registries, and **exits non-zero when something cannot be trusted**, so it drops straight into CI:

```yaml
# .github/workflows/deps.yml
- run: npx -y github:JaydenYoonZK/package-reality-check --fail-on danger
```

| Verdict | Meaning | Fails CI at |
|---|---|---|
| `PHANTOM` | Not in the registry. Likely invented; a squatter may claim it. | `--fail-on phantom` (default) |
| `DANGER` | A fresh, low-download lookalike of a popular package. | `--fail-on danger` |
| `CHECK` | New, deprecated, barely downloaded, or one edit from a popular name. | `--fail-on warn` |
| `OK` | Real and established. | never |

Full options are in `--help`.

<a href="https://jaydenyoonzk.github.io/package-reality-check/?demo">
  <img src="docs/assets/preview.png" alt="Package Reality Check flagging invented packages from an AI-generated requirements.txt, with did-you-mean hints" width="100%">
</a>

## Browser tool

Prefer to paste and look? The **[live tool](https://jaydenyoonzk.github.io/package-reality-check/)** ([demo](https://jaydenyoonzk.github.io/package-reality-check/?demo)) takes a `package.json`, `requirements.txt`, or code with imports and checks it straight from your browser against the registries. Nothing you paste is sent anywhere else.

## What it checks

- `package.json` (every dependency field), `requirements.txt` (specifiers, extras, environment markers), and, with `--include-code`, raw JS/TS or Python source imports
- Skips Node built-ins and the Python standard library, including modules removed in recent Python versions such as `telnetlib`
- Queries npm and PyPI directly; when a name is missing from one registry but exists in the other, it says so rather than crying phantom, so a wrong-ecosystem guess never reads as an invented package
- Flags packages that do not exist, are registered in the last 120 days, are barely downloaded, are deprecated, or are within typo distance of several hundred popular packages
- Explains every verdict in plain language

## Use the engine in your own project

Parsing, stdlib filtering, typo distance, and verdict logic live in a single dependency-free ES module, [`docs/checker.js`](docs/checker.js); the registry lookups are in [`docs/registry.js`](docs/registry.js). Both work in the browser and in Node:

```js
import { checkAll } from "./docs/registry.js";
const results = await checkAll([{ name: "left-pad", ecosystem: "npm" }]);
```

## Tests

```bash
npm test
```

36 tests cover manifest and import parsing, BOM and truncated-file handling, stdlib filtering, PEP 503 normalization, typo distance, every verdict path, the registry layer (with retries and network-error handling, all mocked), and the CLI's argument parsing, file discovery, and output.

## Limitations worth knowing

- Only npm and PyPI. Other ecosystems are tracked in [issues](https://github.com/JaydenYoonZK/package-reality-check/issues).
- Internal/private packages will show as PHANTOM, because the tool can only see public registries. That is also a nudge to protect those names.
- Edit distance cannot read intent; occasional legitimate near-name packages will ask you for thirty seconds of judgment.

## License

MIT. Built and maintained by [Jayden Yoon ZK](https://github.com/JaydenYoonZK). Sibling project: [AI Paste Cleaner](https://github.com/JaydenYoonZK/ai-paste-cleaner).
