# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.5.0] - 2026-07-08

### Added

- `pyproject.toml` support, in the CLI and the browser tool. Reads PEP 621 `dependencies` and `[project.optional-dependencies]` groups, Poetry dependency tables (including groups and legacy dev-dependencies), and `[build-system]` requires. Parsed with a small built-in scanner, so the tool stays dependency-free. Verified against the real manifests of flask, httpx, and rich.
- Continuous integration on GitHub Actions: the full suite runs on Node 18, 20, and 22 for every push and pull request, so the `engines` claim is tested, not assumed.

### Changed

- Typo distance is now optimal string alignment (restricted Damerau-Levenshtein), so an adjacent transposition counts as one edit. Plain Levenshtein scored a swap as two edits, which let the most common real typo slip past the tight limits used for short names: `raect` and `veu` were not linked to `react` and `vue` before, and are now.
- A lookalike name that has sat on the registry for years with almost no downloads is no longer excused by its age. `raect` really exists on npm with a handful of monthly downloads; it now reads DANGER as a likely parked typosquat of `react`, while genuinely adopted near-name packages like `enquirer` and `serve` stay clean.

### Fixed

- The message printed when a manifest is skipped no longer uses an em dash.
- `--fail-on` without a value now says the value is missing instead of printing "undefined", and an unexpected extra argument is an error instead of being silently ignored.

## [1.4.3] - 2026-07-08

### Added

- Detects packages that npm has replaced with a "security holding" placeholder (published as `x.y.z-security`, described "security holding package"). These are names whose original package was pulled for malware or a serious security issue, such as `flatmap-stream` from the event-stream incident. They are now flagged `DANGER` instead of a mild low-download note.
- Validates every dependency name before any lookup. A manifest entry that is really a path, a URL, or an injection attempt (`../../-/npm/v1/...`, `foo?x=1`) is reported as invalid rather than being sent to the registry.

### Fixed

- Closed a URL-injection hole: a crafted dependency name was interpolated into the registry URL unencoded, so `../../` path traversal, a `?` query, or a `#` fragment in a name could reach an unintended endpoint. Names are now validated and fully encoded, and an invalid name makes no network request at all.
- The browser tool now shares the exact registry logic used by the CLI (one `fetchFacts`), so it gains the light-then-full fetch that fixed large packages like `@types/node`, the security-holding detection, and the name-validation and injection fixes. The previously duplicated in-browser lookup code is gone.
- The browser tool escapes quotes in attribute values and the summary wording is accurate ("dangerous" rather than "dangerous lookalike", which no longer fit security-holding packages).

## [1.4.2] - 2026-07-08

### Fixed

- Large packages are no longer wrongly reported as uncheckable. A package with a long release history has a registry document of many megabytes (`@types/node` is about 11 MB), which could exceed the request timeout and read as "could not check". npm lookups now use the tiny `latest` manifest for existence and the download count to judge whether a package is established, and only fetch the full document for a creation date when a package is not already established (those are always small). Scoped packages like `@types/node` and `@babel/core` now resolve quickly and correctly.
- Fixed catastrophic backtracking (a ReDoS) in the JavaScript import scanner used by `--include-code`. A source file with `import`, a long run of whitespace, and no closing quote could hang the tool. The pattern was rewritten to a bounded, non-overlapping form; pathological input now completes in milliseconds. As a bonus, property accesses such as `obj.require("x")` are no longer misread as imports.
- Terminal escape sequences in a dependency name or file path are now stripped before display, so a crafted `package.json` cannot clear your screen, set the terminal title, or inject fake output when scanned. Machine (`--json`) output was already safe.
- A malformed `package.json` whose top level is not an object, or whose dependency block is a string or array, is now rejected as unparseable instead of yielding junk package names or a false clean pass.
- Corrected the age wording in a package's details ("1 year", not "1 years"; never "NaN days").

### Changed

- Source scanning now skips hidden directories (`.github`, `.vscode`, caches) as well as build and vendor directories.

## [1.4.1] - 2026-07-08

### Fixed

- A `package.json` saved with a UTF-8 byte-order mark (what many Windows editors write) is now parsed correctly instead of being silently skipped. A BOM is no longer mistaken for a broken file.
- A manifest that cannot be parsed (a truncated or malformed `package.json` or requirements file) is now reported as such and exits with code 2, rather than reading as "no dependencies, nothing to worry about." A security tool must never give a clean bill of health for a file it could not read. When other manifests parse fine, the unreadable ones are noted and the scan continues.

## [1.4.0] - 2026-07-08

### Fixed

- No more false phantoms on monorepos: dependencies that do not come from the registry (workspace, `file:`, `link:`, git, `github:owner/repo` shorthand, and tarball URLs) are now skipped instead of being looked up and wrongly flagged as invented.
- `npm:` aliases are resolved to their real target, so `"x": "npm:real-package@^1"` checks `real-package`, not `x`.
- Established packages that merely resemble a popular name (like `enquirer` near `inquirer`, or `serve` near `semver`) are no longer flagged as typosquats. A resemblance only matters when the package is also new or obscure, which is the actual squatting profile.
- When every lookup fails, the CLI no longer claims success. It reports that nothing could be verified and exits with code 2, so a flaky network never reads as a clean bill of health in CI.

### Added

- `resolveNpmDep(name, spec)` in the engine, for reuse.

## [1.3.1] - 2026-07-08

### Fixed

- The CLI did nothing and exited 0 when run as an installed command (via `npx` or a `node_modules/.bin` shim), because npm installs bins as symlinks and the entry-point check compared unresolved paths. It now resolves symlinks, so the installed command runs correctly.

## [1.3.0] - 2026-07-08

### Added

- A zero-dependency command-line interface. Run `npx github:JaydenYoonZK/package-reality-check` in a project to scan its package.json and requirements.txt against the live npm and PyPI registries, with `--include-code` to also scan source imports.
- CI integration: the CLI exits non-zero when a dependency cannot be trusted, tunable with `--fail-on phantom|danger|warn|never`. Includes `--json` output, `--quiet`, and color control.
- A shared registry lookup module (`docs/registry.js`) with request timeouts and bounded retries, so a real package is never mislabeled because of one dropped request.
- 14 new tests covering the registry layer (mocked, offline) and the CLI's parsing, file discovery, and rendering, bringing the suite to 29.

### Notes

- The CLI has no runtime dependencies. A supply-chain tool should not itself be a supply-chain risk.

## [1.2.0] - 2026-07-07

### Added

- Ambient 3D background scene with depth of field: eleven glass cubes and shaded spheres from overly large to tiny, near and far sphere pairs on both sides, blur increasing with distance, balanced across both margins, drifting on slow organic paths with wobbling multi-axis tumbles, twinkling star specks in three parallax depth layers with varied size and blur (dark mode only), mouse parallax, and scroll parallax that reveals deeper shapes as the page moves. CSS transforms only, hidden on small screens, adapted per theme, frozen under reduced motion.
- Sticky navigation bar with brand, section links that highlight as you scroll, and smooth anchor scrolling.
- Light and dark mode toggle, persisted across visits, honoring the system preference on first visit, with a ?theme= URL override.
- Animated header illustration in the suite's mini-window style, hidden on small screens to keep mobile content-first.
- Scroll-to-top button that appears after scrolling.
- Emoji accents on section headings.

### Changed

- Entrance and hover motion throughout (CSS only, respects reduced-motion preferences).
- Removed textarea autofocus so the page no longer loads scrolled past the header.

### Fixed

- A bare list of package names (no package.json or imports) is checked against one registry, and a real package from the other ecosystem was wrongly reported as a phantom. Before calling anything a phantom, the checker now confirms it is missing from the other registry too, and otherwise reports "real package, but on the other registry" so a wrong-ecosystem guess never reads as an invented package.
- Scroll-to-top button no longer turns dark on hover (it was caught by the generic secondary-button hover rule).
- Reference tables now scroll inside their own container on narrow screens instead of widening the page.

## [1.1.0] - 2026-07-07

### Added

- Paste and check button that reads the clipboard and runs the check in one step, with a keyboard-shortcut hint where clipboard access is restricted.

## [1.0.0] - 2026-07-07

First stable release.

### Added

- Browser checker for AI-suggested dependencies against npm and PyPI, with direct CORS requests and no middleman.
- Input parsing for `package.json`, `requirements.txt`, and raw JavaScript or Python source, with automatic input-type detection.
- Node built-in and Python standard library filtering (generated from `sys.stdlib_module_names`, plus modules removed in recent Python versions).
- Verdicts: PHANTOM (not in the registry), DANGER (new lookalike of a popular package), CHECK (young, low-download, deprecated, or near-name), OK.
- Typo distance checks against several hundred popular packages per ecosystem, with did-you-mean hints.
- Registration age (npm and PyPI) and monthly download counts (npm) as context.
- Dependency-free ES module engine (`docs/checker.js`) with 15 Node tests.
- `?demo` URL parameter that loads a sample with planted phantoms.

[1.4.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.4.0
[1.3.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.3.1
[1.3.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.3.0
[1.2.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.2.0
[1.1.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.1.0
[1.0.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.0.0
