# Package Reality Check

Verify dependency names against npm and PyPI before installation. Package Reality Check flags missing packages, security placeholders, fresh lookalikes, and other signals that deserve review. Use it as a GitHub Action, zero-dependency CLI, or browser tool.

<p>
  <a href="#cli"><img src="https://img.shields.io/badge/CLI-npx-abcf37?style=for-the-badge&logo=npm&logoColor=black" alt="Run the CLI"></a>
  <a href="#github-action"><img src="https://img.shields.io/badge/GitHub%20Action-use-2465b8?style=for-the-badge&logo=githubactions&logoColor=white" alt="Use the GitHub Action"></a>
  <a href="https://jaydenyoonzk.github.io/package-reality-check/"><img src="https://img.shields.io/badge/Browser%20tool-open-544741?style=for-the-badge&logo=githubpages&logoColor=white" alt="Open the browser tool"></a>
  <a href="https://github.com/JaydenYoonZK/package-reality-check/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/JaydenYoonZK/package-reality-check/ci.yml?style=for-the-badge&label=tests" alt="CI status"></a>
  <a href="https://github.com/JaydenYoonZK/package-reality-check"><img src="https://img.shields.io/github/stars/JaydenYoonZK/package-reality-check?style=for-the-badge&logo=github" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/JaydenYoonZK/package-reality-check?style=for-the-badge" alt="MIT License"></a>
</p>

<a href="https://jaydenyoonzk.github.io/package-reality-check/?demo">
  <img src="docs/assets/preview.png" alt="Package Reality Check showing its dependency input and npm and PyPI verdict workflow" width="100%">
</a>

```console
$ npx github:JaydenYoonZK/package-reality-check

  Package Reality Check  ·  4 packages

  ✗ npm  express-jwt-secure-tokens  PHANTOM  Not found in the registry
       No such package. If an AI tool suggested this name, it likely invented it.
  ✗ npm  lodahs                     DANGER  Replaced by a security placeholder
       npm serves this name as an empty "security holding" version. Do not
       install it without reviewing the package history.
  ! npm  react-codeshift            CHECK  Exists, worth a closer look
       24 downloads last month. Young or rarely downloaded packages deserve
       a quick source review.
  ✓ npm  react                      OK

  1 phantom  ·  1 dangerous  ·  1 to review  ·  1 real

  ✗ 2 packages could not be trusted. Do not install until you have verified each one.
```

Every line above comes from a live registry result. npm currently serves `lodahs` as a security-holding package rather than an installable release.

## Why this exists

Code assistants sometimes recommend packages that do not exist. A study covering 576,000 generated code samples reported average hallucination rates of at least 5.2% for commercial models and 21.7% for open-source models, with 205,474 unique invented package names. See the authors' [USENIX Security paper](https://www.usenix.org/system/files/usenixsecurity25-spracklen.pdf). Repeated names can become targets for slopsquatting: in January 2026, security researcher Charlie Eriksen found `react-codeshift` referenced by 237 repositories and [registered the unused npm name defensively](https://www.aikido.dev/blog/agent-skills-spreading-hallucinated-npx-commands).

Advisory scanners evaluate known packages and versions. They cannot warn about an invented name before someone registers it. Package Reality Check handles that earlier decision: whether a dependency name exists and whether its registry history warrants a closer look.

<a id="github-action"></a>

## GitHub Action

Run the check before installation in pull requests:

```yaml
name: Dependency reality check

on: [pull_request]

permissions:
  contents: read

jobs:
  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0
      - uses: JaydenYoonZK/package-reality-check@v1
        with:
          include_code: true
          fail_on: danger
          # Approved private packages can be listed explicitly:
          # ignore: "@company/private, pypi:internal-lib"
```

The Action runs on Node.js 24 and has no third-party runtime dependencies. `path`, `include_code`, `fail_on`, `ignore`, `json`, and `quiet` are available as inputs.

<a id="cli"></a>

## Command line

Run the CLI directly from this repository. It has no third-party runtime dependencies:

```bash
# scan the current project
npx github:JaydenYoonZK/package-reality-check

# scan a specific directory, and also check source-code imports
npx github:JaydenYoonZK/package-reality-check ./my-app --include-code

# machine-readable output for pipelines
npx github:JaydenYoonZK/package-reality-check --json

# allow an approved private package (repeat as needed)
npx github:JaydenYoonZK/package-reality-check --ignore npm:@company/private
```

It reads `package.json` (every dependency field), `requirements.txt`, and `pyproject.toml`, checks each dependency against the live npm and PyPI registries, and **exits non-zero when something cannot be trusted**, so it drops straight into CI:

```yaml
# .github/workflows/deps.yml
- run: npx -y github:JaydenYoonZK/package-reality-check --fail-on danger
```

| Verdict | Meaning | Fails CI at |
|---|---|---|
| `PHANTOM` | Not in the registry, or not a valid package name. Likely invented; a squatter may claim it. | default, `--fail-on phantom`, `--fail-on warn` |
| `DANGER` | A fresh, low-download lookalike of a popular package, or an npm security-holding placeholder. | default (`--fail-on danger`), `--fail-on warn` |
| `CHECK` | New, deprecated, barely downloaded, or one edit from a popular name. | `--fail-on warn` |
| `OK` | Real and established. | never |

Full options are in `--help`.

### Exit codes and JSON output

The contract a pipeline can rely on:

| Exit code | Meaning |
|---|---|
| `0` | Clean: nothing at or above the `--fail-on` level |
| `1` | Findings at or above the `--fail-on` level |
| `2` | Usage error, no manifest found, an unparseable manifest with nothing else to check, or every lookup failed (nothing was verified) |

`--json` prints one object to stdout:

```json
{
  "packages": 4,
  "unreadable": ["sub/package.json"],
  "results": [
    { "name": "lodahs", "ecosystem": "npm", "level": "danger",
      "title": "Replaced by a security placeholder", "detail": "...",
      "source": "dependencies", "file": "package.json" }
  ]
}
```

`level` is one of `ok`, `warn`, `danger`, `phantom`, or `error` (could not be checked). `unreadable` is present only when a manifest could not be parsed. Explicitly allowed private packages appear in `ignored`.

## Browser tool

The **[live tool](https://jaydenyoonzk.github.io/package-reality-check/)** ([demo](https://jaydenyoonzk.github.io/package-reality-check/?demo)) accepts a `package.json`, `requirements.txt`, `pyproject.toml`, or source imports. Parsing stays in the current tab. Registry requests contain package names and are limited by the page's Content Security Policy to npm and PyPI.

## What it checks

- `package.json` (every dependency field), `requirements.txt` (specifiers, extras, environment markers), `pyproject.toml` (PEP 621 dependencies and optional groups, Poetry tables, and build-system requires), and, with `--include-code`, raw JS/TS or Python source imports
- Skips Node built-ins and the Python standard library, including modules removed in recent Python versions such as `telnetlib`
- Maps common Python imports such as `yaml`, `PIL`, and `sklearn` to their PyPI distribution names
- Queries npm and PyPI directly; when a name is missing from one registry but exists in the other, it says so rather than crying phantom, so a wrong-ecosystem guess never reads as an invented package
- Flags packages that do not exist, are registered in the last 120 days, are barely downloaded, are deprecated, are within typo distance (transpositions included) of a curated pool of 240+ popular packages, or have been replaced by a registry "security holding" placeholder after a takedown
- Validates every name first, so a manifest entry that is really a path, a URL, or an injection attempt is called out instead of being sent to the registry
- Explains every verdict in plain language

## Use the engine in your own project

Parsing, stdlib filtering, typo distance, and verdict logic live in a single dependency-free ES module, [`docs/checker.js`](docs/checker.js); the registry lookups are in [`docs/registry.js`](docs/registry.js). Both work in the browser and in Node:

```js
import { checkAll } from "./docs/registry.js";
const results = await checkAll([{ name: "left-pad", ecosystem: "npm" }]);
```

## Tests

```bash
npm test           # run the suite
npm run coverage   # run with line and branch coverage
```

The suite covers manifest and import parsing, malformed files, package-name validation, bounded hostile input, terminal sanitization, Python import mappings, typo distance, verdict boundaries, registry retries and error paths, CLI exit codes, Action inputs, and static-site metadata. Registry tests are mocked and do not use the network. CI runs Node.js 18, 20, 22, 24, and 26 on Linux, with Node.js 24 checks on Windows and macOS plus a local Action smoke test.

## Limitations worth knowing

- Only npm and PyPI. Other ecosystems are tracked in [issues](https://github.com/JaydenYoonZK/package-reality-check/issues).
- It checks the dependencies you declare, not the resolved lockfile tree. Transitive dependencies are your package manager's territory; this tool guards the moment a name enters your manifest.
- A single run checks at most 2000 unique packages, so a huge or hostile manifest cannot turn a scan into an unbounded flood of registry requests. The overflow count is reported, never dropped silently.
- Internal packages are not visible to public registries. Approve them explicitly with repeatable `--ignore` options or the Action's `ignore` input, and protect the same names from public registration.
- Edit distance cannot read intent; occasional legitimate near-name packages will ask you for thirty seconds of judgment.
- Corporate proxies: Node's built-in fetch does not read `HTTP_PROXY`/`HTTPS_PROXY` by default. On Node 24+ set `NODE_USE_ENV_PROXY=1`; on older versions run it from a network that can reach the registries directly.

## License

MIT. Built and maintained by [Jayden Yoon ZK](https://github.com/JaydenYoonZK). Sibling project: [AI Paste Cleaner](https://github.com/JaydenYoonZK/ai-paste-cleaner).
