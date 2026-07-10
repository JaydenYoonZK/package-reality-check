# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.7.0] - 2026-07-10

### Added

- A dependency-free GitHub Action with inputs for scan path, source imports, failure threshold, output mode, and approved private packages.
- Repeatable `--ignore` options for explicitly approved private npm and PyPI packages.
- Python import mappings for common modules whose names differ from their PyPI distributions.
- Static site checks, `robots.txt`, `sitemap.xml`, and monthly Dependabot checks for GitHub Actions.

### Changed

- `DANGER` is now the default CLI and Action failure threshold.
- CI now covers Node.js 18, 20, 22, 24, and 26 on Linux, plus Node.js 24 on Windows and macOS. Workflow actions are pinned to reviewed revisions.
- The browser design now uses a restrained geometric scene without blurred gradient decorations.

### Fixed

- Python source scanning ignores strings, comments, and docstrings, and handles comma-separated aliases.
- Cross-ecosystem npm existence checks use the lightweight `latest` endpoint.
- Terminal and JSON output replace bidirectional and invisible formatting controls in untrusted names and paths.
- Browser lookup failures no longer produce an all-clear summary, and newer checks supersede older in-flight checks.

## [1.6.1] - 2026-07-10

### Fixed

- Source import scanning no longer treats examples inside JavaScript strings, comments, or regex literals as real dependencies. This prevents `--include-code` from flagging documentation snippets, demos, parser fixtures, or tests as phantom packages.

## [1.6.0] - 2026-07-09

### Added

- Added a Content Security Policy that limits browser registry requests to npm and PyPI.

### Changed

- Accessibility: the paste box now has a real label instead of one hidden with `display:none`, which removed it from the accessibility tree.

### Notes

This release included live npm and PyPI checks for scoped packages, wrong-ecosystem names, established lookalikes, and supported manifest layouts.

## [1.5.17] - 2026-07-09

### Changed

- Updated light-mode accent, status, button, chip, and muted-text colors to improve contrast. Dark mode was unchanged.

## [1.5.16] - 2026-07-09

### Added

- The inline hero illustration now follows light-theme color tokens. Dark mode was unchanged.

## [1.5.15] - 2026-07-09

### Fixed

- Menu highlighting now follows the last section above the sticky-header reading line, including the final section at the bottom of the page.

## [1.5.14] - 2026-07-09

### Changed

- Moved the menu to a wrapping row below the brand bar. Section jumps now measure the sticky header height.

## [1.5.13] - 2026-07-09

### Fixed

- On narrow screens, menu items wrap into a centered row instead of using horizontal scrolling.

## [1.5.12] - 2026-07-09

### Fixed

- The Paste button now requests clipboard access directly on iPhone and iPad. If access is declined, the input is focused and checking starts after a manual paste.

## [1.5.11] - 2026-07-09

### Changed

- The Paste button is now the primary action and replaces existing input.

## [1.5.10] - 2026-07-09

### Changed

- The Paste button used the primary color only when the input was empty. This behavior was replaced in v1.5.11.

## [1.5.9] - 2026-07-09

### Fixed

- Disabled buttons now use muted colors instead of opacity so their tooltips remain readable.

### Changed

- Tooltips are hidden on devices without hover support.

## [1.5.8] - 2026-07-09

### Fixed

- Added version queries to browser CSS and JavaScript references.

## [1.5.7] - 2026-07-09

### Fixed

- Tooltip positioning now uses a zero-specificity selector.

## [1.5.6] - 2026-07-09

### Fixed

- The Check and Clear buttons could stay disabled after loading a sample or pasting, because those set the box programmatically without firing an input event. The button state is now re-synced at the start of every check, so it is always correct however the box was filled.

### Added

- Animated tooltips on the toolbar buttons, on hover and on keyboard focus, explaining what each button does. Disabled buttons explain why (for example, "Paste or type some dependencies first").

### Changed

- On touch devices, the Paste button now focuses the box for a native one-tap paste instead of triggering the clipboard-permission popup that needed a second tap. Desktop keeps its one-click paste.
- Disabled buttons use the correct muted color token.

## [1.5.5] - 2026-07-09

### Changed

- Check and Clear are disabled when the input is empty. Check is also disabled during a lookup.

## [1.5.4] - 2026-07-09

### Fixed

- The "no manifest found" error and the browser's wrong-ecosystem hint listed only `package.json` and `requirements.txt`, even though `pyproject.toml` has been supported since 1.5.0. Both now mention it, so a user pointing the tool at a Python project gets accurate guidance.

### Changed

- Refreshed the README screenshot and added a 1200x630 social image.
- Added the `bugs` URL to package.json so `npm bugs` and the package page point at the issue tracker.

## [1.5.3] - 2026-07-09

### Fixed

- A non-404 error from the npm `latest` endpoint (a `403`, a proxy error page, anything that was not a clean success) was treated as proof the package exists. Existence now requires a successful response; any other status falls through to the authoritative full-document check and, failing that, is reported as an error rather than a confident verdict. Found while writing a boundary test for the error path.

### Changed

- Added boundary tests for every verdict threshold, registry error paths, and `npm run coverage`.
- Registry tests are now hermetic: an un-mocked network call fails loudly instead of silently reaching the internet, and the real `fetch` is restored after each test, so the suite is order-independent.

## [1.5.2] - 2026-07-09

### Security

- Bounded the work per run at 2000 unique packages. A hostile or broken manifest with an enormous dependency list can no longer turn a scan into an unbounded flood of registry requests. The overflow count is reported in both the human summary and the `--json` output (`notChecked`), never dropped silently.
- Defense in depth in the browser tool: the "view" link's URL and every interpolated value in a result row are now HTML-escaped, so a rendering change could never reopen an injection path even though names are already validated before they get that far. External links now carry `rel="noopener noreferrer"`.

### Notes

Regression tests cover modifier-heavy parser input, crafted object keys, and terminal control characters.

## [1.5.1] - 2026-07-09

### Added

- Integration tests: the suite now runs the real CLI as a subprocess and asserts every exit code (0 clean, 1 findings, 2 usage error, no manifest, unreadable manifest, and the JSON error shape). Previously only library functions were tested.
- CI now also runs on Windows and macOS, alongside Node 18, 20, and 22 on Linux.
- A security policy (SECURITY.md) with private reporting instructions.

### Changed

- Updated the README console example to match current registry verdicts, including npm's security-holding response for `lodahs`.
- The README documents the exit-code table and the `--json` output shape, states the typo pool size precisely (240+ curated names), and notes that the tool checks declared dependencies, not the resolved lockfile tree.

### Fixed

- The cross-registry check no longer queries PyPI for scoped npm names (they cannot exist there) and lowercases names when checking the npm side, so a PyPI-style name like `Flask_SQLAlchemy` gets an honest wrong-ecosystem answer.
- `npm test` no longer relies on shell glob expansion, so it works on Windows.
- The browser tool's detection note is announced to screen readers.

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

- Detects npm security-holding placeholders (a `-security` version or the description "security holding package") and flags them `DANGER`.
- Validates every dependency name before any lookup. A manifest entry that is really a path, a URL, or an injection attempt (`../../-/npm/v1/...`, `foo?x=1`) is reported as invalid rather than being sent to the registry.

### Fixed

- Closed a URL-injection hole: a crafted dependency name was interpolated into the registry URL unencoded, so `../../` path traversal, a `?` query, or a `#` fragment in a name could reach an unintended endpoint. Names are now validated and fully encoded, and an invalid name makes no network request at all.
- The browser tool now shares the exact registry logic used by the CLI (one `fetchFacts`), so it gains the light-then-full fetch that fixed large packages like `@types/node`, the security-holding detection, and the name-validation and injection fixes. The previously duplicated in-browser lookup code is gone.
- The browser tool escapes quotes in attribute values and the summary wording is accurate ("dangerous" rather than "dangerous lookalike", which no longer fit security-holding packages).

## [1.4.2] - 2026-07-08

### Fixed

- Established npm packages now use the small `latest` manifest and downloads endpoint instead of always fetching full package history.
- Replaced a backtracking-prone JavaScript import pattern with a bounded scanner. Property calls such as `obj.require("x")` are no longer treated as imports.
- Terminal control characters in dependency names and file paths are replaced before human-readable output.
- A malformed `package.json` whose top level is not an object, or whose dependency block is a string or array, is now rejected as unparseable instead of yielding junk package names or a false clean pass.
- Corrected the age wording in a package's details ("1 year", not "1 years"; never "NaN days").

### Changed

- Source scanning now skips hidden directories (`.github`, `.vscode`, caches) as well as build and vendor directories.

## [1.4.1] - 2026-07-08

### Fixed

- A `package.json` saved with a UTF-8 byte-order mark (what many Windows editors write) is now parsed correctly instead of being silently skipped. A BOM is no longer mistaken for a broken file.
- A manifest that cannot be parsed is reported and exits with code 2 when nothing else can be checked. Other readable manifests are still scanned.

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
- A shared registry lookup module (`docs/registry.js`) with request timeouts and bounded retries.
- 14 new tests covering the registry layer (mocked, offline) and the CLI's parsing, file discovery, and rendering, bringing the suite to 29.

### Notes

- The CLI has no runtime dependencies. A supply-chain tool should not itself be a supply-chain risk.

## [1.2.0] - 2026-07-07

### Added

- Added a CSS background scene with geometric shapes, stars, pointer and scroll parallax, theme variants, a small-screen cutoff, and a reduced-motion state.
- Sticky navigation bar with brand, section links that highlight as you scroll, and smooth anchor scrolling.
- Light and dark mode toggle, persisted across visits, honoring the system preference on first visit, with a ?theme= URL override.
- Animated header illustration in the suite's mini-window style, hidden on small screens to keep mobile content-first.
- Scroll-to-top button that appears after scrolling.
- Added section-heading accents. These were removed in a later design pass.

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

[1.7.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.0
[1.6.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.6.1
[1.6.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.6.0
[1.5.17]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.17
[1.5.16]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.16
[1.5.15]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.15
[1.5.14]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.14
[1.5.13]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.13
[1.5.12]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.12
[1.5.11]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.11
[1.5.10]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.10
[1.5.9]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.9
[1.5.8]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.8
[1.5.7]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.7
[1.5.6]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.6
[1.5.4]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.4
[1.5.3]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.3
[1.5.2]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.2
[1.5.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.1
[1.5.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.0
[1.4.3]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.4.3
[1.4.2]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.4.2
[1.4.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.4.1
[1.4.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.4.0
[1.3.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.3.1
[1.3.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.3.0
[1.2.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.2.0
[1.1.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.1.0
[1.0.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.0.0
