# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.6.1] - 2026-07-10

### Fixed

- Source import scanning no longer treats examples inside JavaScript strings, comments, or regex literals as real dependencies. This prevents `--include-code` from flagging documentation snippets, demos, parser fixtures, or tests as phantom packages.

## [1.6.0] - 2026-07-09

### Added

- A Content Security Policy on the browser tool. Unlike the rest of the suite, this tool must reach the network, so instead of blocking it, the policy pins outbound connections to exactly npm and PyPI. Even if markup were ever injected, the browser would refuse to send your dependency list to any other host. Verified in a browser: the registry lookups still work and a request to any other origin is blocked.

### Changed

- Accessibility: the paste box now has a real label instead of one hidden with `display:none`, which removed it from the accessibility tree.

### Notes

This release followed a full audit of the engine, including live checks against npm and PyPI. No correctness or security defects were found: scoped packages resolve correctly, the cheap-existence path holds for scoped names (no accidental multi-megabyte fetch), wrong-ecosystem guesses do not read as phantoms, established lookalikes are not flagged, and the parsers handle extras, environment markers, aliases, and Poetry, PEP 621, and build-system layouts. The prior hardening rounds (ReDoS, terminal-escape injection, the request cap, security-holding detection, and the 403-is-not-existence fix) remain in place.

## [1.5.17] - 2026-07-09

### Changed

- Light mode's status colors are livelier and now measurably meet WCAG AA. The olive green, brown amber, and muted red came from darkening alone, which made them muddy; they are replaced with fully saturated deep equivalents (accent #4c7a00, green #1d7a25, orange #ba4700, red #c62a22), the soft chip tints were eased to match, primary buttons in light mode use white text on the deep accent, and light muted text was deepened one step. Measured on the rendered page, every status pill, link, button label, and muted text now sits at 4.5:1 or better; the previous accent and the muted text on tinted chips quietly failed. Dark mode is untouched.

## [1.5.16] - 2026-07-09

### Added

- The hero illustration now has a light-mode version. It is the same inline drawing recolored through the theme tokens, so it follows the theme toggle instantly and always stays in step with the palette. Dark mode is unchanged.

## [1.5.15] - 2026-07-09

### Fixed

- Clicking a menu item now always highlights the item you clicked. The highlight was driven by an observer watching a band in the middle of the viewport, but a menu jump lands the section heading at the top, outside that band, so the green pill often stayed on a section the page had merely scrolled past. The active item is now computed directly from the scroll position: the last section whose heading sits above the reading line under the header, with the last section winning at the very bottom of the page.

## [1.5.14] - 2026-07-09

### Changed

- The menu now sits in its own tinted band under the brand bar on every screen size, giving the header a clear hierarchy: brand and theme toggle on top, menu below, every item always visible. The whole header is sticky again on all devices, and section jumps measure the header instead of assuming its height, so they land exactly below it however many rows the menu wraps to.

## [1.5.13] - 2026-07-09

### Fixed

- On phones the menu no longer hides items behind an invisible horizontal scroll. Below 720px it wraps onto its own row under the brand with every item visible and centered, and the bar scrolls away with the page instead of pinning several rows to a small screen; the back-to-top button brings it back into reach. Desktop keeps the single sticky row, and section jumps account for the new offsets.

## [1.5.12] - 2026-07-09

### Fixed

- The Paste button works on iPhone and iPad again. The previous touch flow skipped the iOS clipboard confirmation and waited for a manual paste that most people never discover, so the button looked dead. The clipboard is now requested the same way on every device: iOS shows its Paste confirmation at the tap point, and confirming it fills the box and runs the check in one motion. If the read is declined, the box is focused with a hint and the check runs by itself as soon as a paste lands. An empty clipboard now says so.

## [1.5.11] - 2026-07-09

### Changed

- The Paste button is now the primary (green) action at all times, rather than only when the box is empty. Pasting overwrites the box, so there is no need to Clear first; on touch devices the existing text is now selected before pasting so a native paste replaces it too.

## [1.5.10] - 2026-07-09

### Changed

- The Paste button is now highlighted (green) only when the input box is empty, which is the moment pasting is the natural next step, and calms to a neutral button once there is content to work with. Browsers do not allow reading the clipboard without a click, so a button cannot truthfully light up because something was copied elsewhere; tying the highlight to the empty box gives it an honest, useful meaning instead.

## [1.5.9] - 2026-07-09

### Fixed

- A disabled button's tooltip was dimmed along with the button, because the button was faded with opacity, which also fades its tooltip. Since the tooltip is exactly what explains why a button is disabled, it now stays fully readable: the disabled look comes from muted color and the dashed border instead of opacity.

### Changed

- Tooltips are no longer shown on touch devices (`@media (hover: none)`), where a tap would briefly flash the tooltip, which was more distracting than helpful.

## [1.5.8] - 2026-07-09

### Fixed

- The browser tool's stylesheet and script are now referenced with a version query, so a browser that cached an older copy fetches the current one after a deploy instead of serving stale files. The CLI is unaffected.

## [1.5.7] - 2026-07-09

### Fixed

- Made the button tooltip positioning defensive: the helper that anchors a tooltip to its button now has zero specificity, so it can never override a button's own layout. This has no visible effect here, but it fixes a sibling tool whose absolutely-positioned clear button was being knocked out of place.

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

- The browser tool's Check and Clear buttons are now disabled when the input box is empty, since there is nothing to check and nothing to clear. Disabled buttons are visibly dimmed with a dashed edge and a not-allowed cursor. Clear stays available while a check is running, so you can reset mid-run; Check is disabled only while it is busy or the box is empty.

## [1.5.4] - 2026-07-09

### Fixed

- The "no manifest found" error and the browser's wrong-ecosystem hint listed only `package.json` and `requirements.txt`, even though `pyproject.toml` has been supported since 1.5.0. Both now mention it, so a user pointing the tool at a Python project gets accurate guidance.

### Changed

- Refreshed the screenshot in the README: it now shows the current interface and real results, including the "did you mean" hint, rather than a pre-check state from an older version of the tool.
- Added a dedicated 1200x630 social-share card, so links shared to Slack, X, or LinkedIn render a clean preview instead of a cropped screenshot.
- Added the `bugs` URL to package.json so `npm bugs` and the package page point at the issue tracker.

## [1.5.3] - 2026-07-09

### Fixed

- A non-404 error from the npm `latest` endpoint (a `403`, a proxy error page, anything that was not a clean success) was treated as proof the package exists. Existence now requires a successful response; any other status falls through to the authoritative full-document check and, failing that, is reported as an error rather than a confident verdict. Found while writing a boundary test for the error path.

### Changed

- Test suite expanded from 68 to 79 tests, driven by a coverage measurement. Added boundary-value tests that pin every verdict threshold (new-package at 120 days, low-downloads at 500, established at 20000 downloads and 365 days) one unit either side of the line, tests for the previously-uncovered verdict and registry-error branches, and `npm run coverage`. The engine modules are now at 100% line coverage.
- Registry tests are now hermetic: an un-mocked network call fails loudly instead of silently reaching the internet, and the real `fetch` is restored after each test, so the suite is order-independent.

## [1.5.2] - 2026-07-09

### Security

- Bounded the work per run at 2000 unique packages. A hostile or broken manifest with an enormous dependency list can no longer turn a scan into an unbounded flood of registry requests. The overflow count is reported in both the human summary and the `--json` output (`notChecked`), never dropped silently.
- Defense in depth in the browser tool: the "view" link's URL and every interpolated value in a result row are now HTML-escaped, so a rendering change could never reopen an injection path even though names are already validated before they get that far. External links now carry `rel="noopener noreferrer"`.

### Notes

This release followed an offensive-security pass. Confirmed with proof-of-concept inputs and locked in with regression tests: no catastrophic-backtracking (ReDoS) in any parser (package.json, requirements.txt, pyproject.toml, source imports, name validation) even at 200k-character inputs; no prototype pollution through crafted `__proto__` or `constructor` keys; and no terminal-escape injection through any verdict message (the package name reaches the terminal only through the sanitized column).

## [1.5.1] - 2026-07-09

### Added

- Integration tests: the suite now runs the real CLI as a subprocess and asserts every exit code (0 clean, 1 findings, 2 usage error, no manifest, unreadable manifest, and the JSON error shape). Previously only library functions were tested.
- CI now also runs on Windows and macOS, alongside Node 18, 20, and 22 on Linux.
- A security policy (SECURITY.md) with private reporting instructions.

### Changed

- The README console example is now the verbatim output of a real run. The old example had drifted: `lodahs` is no longer a mild "one edit away" note, it is a DANGER, because npm seized that name after actual malware shipped under it.
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

[1.6.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.6.1
[1.6.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.6.0
[1.5.17]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.17
[1.5.16]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.16
[1.5.15]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.15
[1.5.14]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.14
[1.5.13]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.13
[1.5.12]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.12
[1.4.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.4.0
[1.3.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.3.1
[1.3.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.3.0
[1.2.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.2.0
[1.1.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.1.0
[1.0.0]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.0.0
