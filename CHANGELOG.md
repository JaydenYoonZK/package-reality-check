# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.7.58] - 2026-07-16

A deep quality pass from an adversarial pre-launch review: correctness of the detection verdicts, the CLI, the page, and the docs.

### Fixed

- Poetry git, path, url, and file dependencies are no longer reported as phantom ("an AI likely invented it"). An inline table pointing at a non-registry source is skipped, the same way the npm parser already skips git and file specs, so a normal Poetry monorepo or fork no longer lights up as hallucinated.
- PEP 508 direct references in requirements.txt (`name @ url`) are recognized as URL, VCS, or path sources and skipped, instead of being looked up and branded as invented packages.
- Piped output is no longer truncated. The tool exited before the pipe drained, so `--json | jq` and any report over about 64 KB were cut off mid-stream; output now flushes fully before exit.
- A UTF-16 requirements.txt (what PowerShell's `pip freeze` writes) is decoded by its byte-order mark instead of read as empty, so a real file no longer reports a false clean pass.
- `--no-color` now also strips the brand banner's color, matching its documented promise.
- The 404 page works at any URL depth: its stylesheet, script, and links are project-absolute, so a missing path two or more segments deep is styled and navigable rather than raw HTML with a dead back button.
- `prefers-reduced-motion` now pauses the page's SVG animations, which CSS rules cannot stop.
- Theme reading and writing survive blocked browser storage (private modes, strict settings) instead of throwing.
- The back-to-top button leaves the keyboard tab order while it is hidden.
- A registry response that returns HTTP 200 with an unreadable body now reports "an unreadable response" rather than the contradictory "registry answered 200".

### Changed

- The import-name map covers pyOpenSSL and pywin32 (and PyJWT, pycryptodome), so `--include-code` no longer false-phantoms those common packages.
- A `theme-color` meta follows the active theme so mobile browser chrome matches the page.
- The `--help` exit-code note and the site's "non-zero" wording match the README exactly.
- `funding` field in package.json, and the GitHub repo description and topics now name the Action.

## [1.7.57] - 2026-07-16

### Added

- A color option on the shared brand banner module, so a future --no-color style flag can render it plain; NO_COLOR already could.

## [1.7.56] - 2026-07-16

### Added

- A Jayden Yoon ZK brand banner in the terminal: the name in ASCII art prints when the tool runs in an interactive terminal, and stays out of pipes, JSON, and CI logs so automated runs see only their data.

## [1.7.55] - 2026-07-15

### Added

- A Terminal section on the page: three copyable command cards for checking a project, failing the build at a chosen severity, and the one-step GitHub Action, all linked from the navigation.

## [1.7.54] - 2026-07-15

### Added

- A sponsor heart in the navigation, beside the theme toggle: quiet at rest, GitHub sponsor pink on hover, with the toggle's own downward tooltip and arrow, linking to the GitHub Sponsors profile. On the 404 page too.

## [1.7.53] - 2026-07-12

### Fixed

- The strip above the navigation bar is solid now. iOS skips the frosted blur in the overscroll zone, so the translucent skin let content ghost through it; the bleed wears the opaque page background, which reads identically to the bar over an empty page in both themes.

## [1.7.52] - 2026-07-12

### Fixed

- The navigation bar now bleeds its own skin above the viewport, so iOS elastic scrolling, the collapsing Safari chrome, and desktop rubber-banding show navigation instead of a bare transparent strip. Works in both themes.

## [1.7.51] - 2026-07-12

### Added

- A purpose-built 1280x640 social preview card, and the page's link-sharing metadata now points at it with honest dimensions.

## [1.7.50] - 2026-07-12

### Changed

- The navigation bar's soft shadow shows at all times now instead of appearing on scroll.

## [1.7.49] - 2026-07-12

### Added

- The navigation bar lifts with a soft, tight shadow once the page scrolls beneath it, and sits flush again at the top. Each theme carries its own tint.

## [1.7.48] - 2026-07-12

### Added

- An "All projects" pill at the end of the navigation and a footer link, both pointing at the new projects directory, one page that lists every tool.

## [1.7.47] - 2026-07-12

### Added

- A "Why I built this" story closes the page, paired with the suite's sprout scene and linked from the navigation, matching the sibling tools.

### Changed

- The FAQ heading reads "Frequently asked questions" now.
- Every section heading carries an emoji now, matching the rest of the suite.

## [1.7.46] - 2026-07-12

### Added

- The FAQ is a set of full-width accordions now, each question carrying a plus that turns into a close mark as the answer unfolds, with the state exposed to keyboards and screen readers.
- The page carries a real-and-phantom package scene beside the hallucination explainer and two-column reference lists, so sections close at the full width instead of trailing off empty on the right.

### Changed

- Result chips grow to close each row, the seam between the tool and the prose is tighter, and loose paragraphs run the full section width.

## [1.7.45] - 2026-07-12

### Fixed

- The privacy pill's lock now stays vertically centered when the text wraps to a second line.

## [1.7.44] - 2026-07-12

### Changed

- The footer is now centered, and the copyright line links a bold Jayden Yoon ZK to https://www.JaydenYoonZK.com.

## [1.7.43] - 2026-07-12

### Added

- Every page, including the 404, now closes with a quiet copyright line in the footer: Copyright © Jayden Yoon ZK with the current year, All Rights Reserved. The year keeps itself current.

## [1.7.42] - 2026-07-12

### Added

- Source attribution in the shipped files. Every stylesheet and script now opens with a license banner naming Jayden Yoon ZK, each page carries an author meta tag and an HTML notice, and the browser console prints a small signature with a link back to the source.

## [1.7.41] - 2026-07-12

### Fixed

- The 404 page's key and tool cards no longer pick up the prose link underline on hover, focus, or press.

## [1.7.40] - 2026-07-12

### Fixed

- The 404 page now carries the same Built by Jayden Yoon ZK footer as every other page.
- Short pages no longer show a hard-edged second copy of the page glow near the bottom. The body background propagates to the canvas, which tiles the glow image below a short page; the glow is now painted exactly once.

## [1.7.39] - 2026-07-12

### Added

- The page now loads offline. A small service worker caches the shell on the first visit, answers repeat visits from cache while refreshing in the background, and drops old caches on every release. Live lookups still need a connection and pass through the worker untouched.

## [1.7.38] - 2026-07-11

### Changed

- The 404 page is now a full member of the site. It carries the brand navigation bar with the working theme toggle and crossfade, the ambient three dimensional background scene with its parallax, the cursor dust, and a new animated illustration of a browser window missing its page, complete with a searching magnifying glass. Navigation links from the 404 lead back into the tool's sections.

## [1.7.37] - 2026-07-11

### Added

- A branded 404 page. Broken or mistyped links now land on a page in the full design, with a note written in the tool's own voice, a chartreuse key back to the tool, and a grid linking the six sibling tools. GitHub Pages serves it automatically for any missing path, and search engines are told not to index it.

## [1.7.36] - 2026-07-11

### Added

- The site now publishes its own search and AI crawler metadata: a robots.txt with a deliberate allow policy, a sitemap.xml, and an llms.txt that maps the tool, documentation, and source for AI systems. The llms.txt follows the structure the format proposes, with the required name heading, a summary blockquote, and annotated link sections.

## [1.7.35] - 2026-07-11

### Added

- A skip to main content link for keyboard and screen reader users. It waits off screen as the page's first focusable element and drops in as a chartreuse key when focused, jumping past the navigation straight to the tool. The slide respects reduced motion preferences.

## [1.7.34] - 2026-07-11

### Fixed

- A disabled primary button no longer blends the pressed-key look with the dashed disabled outline. The primary styling outranked the disabled state, so buttons such as a not-yet-usable submit looked clickable and not clickable at once, with light mode even painting the full chartreuse key under the dashes. Disabled primaries now render as a flat ghost in both themes.
- The "view" links in the results table carry a small open-in-new icon, so they read as something that opens.

## [1.7.33] - 2026-07-11

### Fixed

- Tables are readable on phones. The old narrow-screen treatment turned tables into sideways-scrolling boxes with no hint that more columns existed, so status pills were chopped mid-word and explanation columns sat invisible off-screen. Rows now restack as cards on narrow screens: names and pills flow on one line, the explanation wraps at full width beneath them, decorative header rows step aside, and nothing scrolls sideways.

## [1.7.32] - 2026-07-11

### Changed

- The film grain steps up once more in both themes. With the fine dot size this reads as richer paper texture rather than noise. README previews regenerated.

## [1.7.31] - 2026-07-11

### Changed

- The film grain is a touch more present in both themes, still well below its original strength, keeping gradients dithered while the texture stays a quiet detail. README previews regenerated.

## [1.7.30] - 2026-07-11

### Changed

- Button shadows are lighter. The ground shadow under the 3D keys drops much of its opacity and trades its tight spread for a softer blur, so it reads as ambient light falloff instead of an ink block, and the hard edge tone eases slightly in both themes. The key geometry and travel are unchanged. README previews regenerated.

## [1.7.29] - 2026-07-11

### Added

- The resize corner of text boxes shows a hand-drawn affordance again: two diagonal grip lines in brand green floating on a transparent square, so people can tell the box expands while the rounded corner stays clean. Light mode uses the deeper green for contrast on cream.

## [1.7.28] - 2026-07-11

### Fixed

- Scrollbars inside rounded boxes no longer break the corner. A scrollbar strip is always rectangular, so the glow, the center rail, and the system resize grip read as a square poking through a text box's corner radius. Inner scrollables now show a clean chartreuse pill with no glow or rail and an invisible resizer, while the page scrollbar, whose corners really are square, keeps the full glowing treatment.

## [1.7.27] - 2026-07-11

### Changed

- The scrollbar now carries the brand. The thumb is a glowing chartreuse key-cap pill with the same top-lit gradient the buttons use, riding a faint chartreuse center rail. It brightens and thickens under the pointer and charges up with a hotter gradient and stronger glow while being dragged. Firefox shows a solid chartreuse thumb through the standard scrollbar properties.

## [1.7.26] - 2026-07-11

### Added

- Custom scrollbars, on the page and inside any scrollable box such as the paste areas and code snippets. A slim rounded pill floats on a fully transparent track in each theme's surface tone, thickens and brightens under the pointer, and turns chartreuse while being dragged, the same accent the buttons use. WebKit browsers get the full treatment and Firefox gets the matching thin themed scrollbar through the standard properties.

## [1.7.25] - 2026-07-11

### Added

- Selected text now wears the brand. Highlighting any text shows the same chartreuse-with-dark-ink pairing the primary buttons use, identical in both themes, replacing the browser's default blue.

## [1.7.24] - 2026-07-11

### Fixed

- The cursor dust now lands directly on the pointer. The trail canvas is a replaced element, so inset alone did not stretch it and it laid out at its intrinsic retina-scaled size; on high-density displays every spark drew at a multiple of the cursor's position, drifting further from it toward the bottom right of the page. The canvas is now explicitly stretched to the viewport, verified at retina density.

## [1.7.23] - 2026-07-11

### Added

- A magical cursor trail. Tiny chartreuse sparks with the occasional twinkling four point star follow the pointer and burn out about a second after it rests. Dark mode gets pale glowing dust, light mode a deeper green so it stays visible on cream. It runs on a single fixed canvas, spawn rate follows how far the pointer travels, and the animation loop stops the moment the last spark dies, so an idle page costs nothing. Touch devices never load it and reduced motion turns it off entirely.

## [1.7.22] - 2026-07-11

### Changed

- The film grain is finer and milder. Each grain dot is now half its previous size, one device pixel on typical phone screens, and the overall intensity is reduced by about a quarter in both themes. Finer grain dithers banding more efficiently per unit of opacity, so gradients stay smooth while the texture recedes to a whisper. README previews regenerated.

## [1.7.21] - 2026-07-11

### Fixed

- The theme toggle no longer glitches when tapped on phones. Touch browsers pin the hover state to the last-tapped control, so after a tap the toggle sat stuck mid-twist with its hover halo on, layered over the press spin. All decorative hover styling for buttons, the toggle, and the scroll-to-top control now only exists on devices that can actually hover; touch devices get the clean press feedback alone. Controls also opt out of the double-tap zoom gesture, so taps respond without hesitation.

## [1.7.20] - 2026-07-11

### Fixed

- The film grain now actually renders on iPhone and iPad. WebKit does not apply SVG filters when an SVG is rasterized as a CSS background image, so the turbulence-based tile painted a faint dark veil with no noise at all on iOS, leaving gradient banding fully visible there. The grain is now a small pre-rendered raster tile that every browser draws identically, and it renders pixel-crisp on high-density screens instead of being smoothed into blur when the display upscales it. Gradient banding is dithered away in both themes with no soft or low-quality look. README previews regenerated.

## [1.7.19] - 2026-07-11

### Fixed

- The key press finally travels. During a click the pointer is still hovering, and the hover lift rule outranked the press rule, so the cap held its raised position while the shadows switched to pressed geometry, which read as the base jumping up instead of the cap going down. The press is now declared after the hover lift at matching specificity and wins the cascade, so the cap visibly sinks 3px into its anchored base on every click.
- Dark mode's primary button no longer loses its 3D edge on hover. A leftover rule from before the key redesign replaced the whole hover shadow with a flat glow.
- In light mode the pressed shadow now outranks the hover shadow mid click, so the primary button's base geometry stays correct through the press.
- Tapping controls on phones no longer flashes the system's default grey tap rectangle over the design's own pressed states. Keyboard focus outlines are unaffected.

## [1.7.18] - 2026-07-11

### Changed

- The 3D key buttons are rebuilt on realistic press physics. The base and its ground shadow are now anchored in place through every state: at rest the cap sits proud on a 5px base, hovering lifts the cap 1px while the base bottom stays put, and pressing sinks the cap 3px into the base with 2px of it still showing beneath the sunken cap, its ground shadow never moving and the shading inside the cap deepening. Before, the whole assembly moved together and the press read as the base rising instead of the cap sinking. Under reduced motion the cap stays still and only the shading responds. README previews are regenerated with the new resting stance.

## [1.7.17] - 2026-07-10

### Changed

- Pressing a button now reads as the cap sinking into its socket. Before, the dark bottom edge collapsed as the button traveled down, which looked like the base rising to meet it. The edge now stays put beneath the sunken cap and a soft shadow falls across the cap's top, so the press feels like a real key going down.

## [1.7.16] - 2026-07-10

### Added

- A whisper of film grain now sits over the whole page in both themes. Large soft gradients band into visible steps on most displays; the static monochrome noise dithers those steps away and gives the surface a subtle print-like tooth. It is one tiled SVG turbulence texture with no blend mode and no animation, so it composites for free, stays out of pointer input, and is dropped entirely in print. README previews are regenerated with the new surface.

## [1.7.15] - 2026-07-10

### Fixed

- The theme toggle now turns and swells on hover on every page, the playful twist that until now only the WHMCS Emoji Compatibility Guide showed. All pages always shared the same hover rule, but a more specific button rule was overriding its transform with the standard key lift on the other tools. The toggle's hover and press rules now outrank the tactile key rules everywhere.
- Hovers and tooltips respond during the theme crossfade again. The crossfade overlay intercepts pointer input by default, which deadened the page, most noticeably the toggle's own hover twist and tooltip, for half a second after every theme switch. The live page underneath now stays interactive while the fade plays, matching how immediate the toggle felt before the fade shipped.

## [1.7.14] - 2026-07-10

### Fixed

- Tooltip arrows are visible again. The arrow is a bordered square whose colored wedge sat entirely behind the tooltip bubble, which paints later and shares the same ink color, so the bubble swallowed the arrow and nothing bridged the gap to the button. The arrow now sits with its tip in the gap, 4px off the button, and its base tucked one pixel under the bubble edge, painting above the bubble so the two read as a single speech-bubble shape. Both variants are fixed, the standard bubble above a button and the theme toggle's bubble below it.

## [1.7.13] - 2026-07-10

### Fixed

- The theme crossfade no longer stutters on phones. The browser's default crossfade blends the old and new page snapshots with a plus-lighter blend inside an isolated compositing group, which means two full-screen render passes every frame. Desktop GPUs absorb that, phone GPUs drop frames. The new page now sits fully opaque underneath while the old snapshot simply fades out above it, which reads identically on an opaque page and costs a single alpha layer. Decorative drift animations also pause for the half second the fade runs, freeing GPU headroom on mobile without any visible freeze.

## [1.7.12] - 2026-07-10

### Fixed

- Text no longer flashes and re-settles mid fade when switching between light and dark mode. Text color inherits, so during the old per-element fade every element kept re-easing its parent's already animating color, which made type lag behind the page and snap late. The switch now crossfades the whole page as a single composited snapshot through the View Transitions API, so text and background move together in one smooth pass. The theme toggle is excluded, so its sun and moon morph still plays live. Browsers without view transitions fall back to fading backgrounds, borders and shadows only, with text changing in one clean step.

## [1.7.11] - 2026-07-10

### Fixed

- The inline code chip inside alerts no longer renders as a dead grey block in light mode. Its 35% black wash was tuned for dark backgrounds; over the light pink alert it read as mud. In light mode the chip is now a crisp near-white card with a hairline red keyline, so the decoded payload stands out cleanly.

### Changed

- Switching themes now fades the whole page between night and day over half a second instead of snapping instantly, which could startle or dazzle, especially dark to light at night. The fade covers colors only (backgrounds, text, borders, shadows, SVG fills), and the theme toggle is excluded so its sun and moon morph keeps its own spring timing.

## [1.7.10] - 2026-07-10

### Fixed

- The theme toggle now shows the crescent moon on phones. The previous build morphed the mark by animating SVG geometry (the circle's radius and the mask position) from CSS, which desktop browsers support but iOS Safari does not apply, so dark mode on a phone showed a plain dot instead of a moon. The switch is rebuilt on opacity and transform only, the sun spins away as a true crescent path spins in, which every mobile browser animates. Same look on desktop, now correct everywhere.

## [1.7.9] - 2026-07-10

### Changed

- The theme toggle is redesigned from an emoji swap into a morphing mark. One vector drawing plays the whole switch: the sun's core grows into the moon while a masked bite slides in to carve the crescent, the eight rays spring away with an overshoot, and the mark tilts to seat the crescent, all reversed when switching back. The moon is brand chartreuse at night and the sun is warm amber by day, the round button trades the key edge for a soft brand halo on hover, and a tooltip appears below it saying which mode a click will switch to, on hover and keyboard focus only, never on touch. The morph is disabled under reduced-motion preferences.
- The README preview is regenerated.

## [1.7.8] - 2026-07-10

### Fixed

- The back-to-top button no longer casts a heavy black smudge in light mode. Its shadow was a single wide dark-theme blur that was never re-tuned for a cream background. Each theme now gets a layered shadow of its own: a tight warm contact shadow plus a soft chartreuse halo in light mode, and a grounded contact shadow with a gentle chartreuse under-glow in dark, with matching hover and pressed variants.

## [1.7.7] - 2026-07-10

### Changed

- Removed the pulsing status dot from the privacy pill. The animated dot has become one of the most recognizable template cliches on the web, and it was redundant next to the lock icon that already carries the meaning. The pill now leads with the lock alone, with its padding evened out.
- The README preview is regenerated.

## [1.7.6] - 2026-07-10

### Added

- Tactile depth across the interface. Every button is now built like a physical key: a hard edge shadow beneath it, a soft ambient shadow, and a hairline top bevel. Hovering lifts the key slightly, and pressing travels it down while the edge collapses underneath, a real press you can feel. Primary buttons carry a chartreuse edge and glow, secondary buttons use a warm brand-brown edge in light mode and a deep neutral one in dark, disabled buttons stay flat since a dead control should not look pressable, and the movement is disabled under reduced-motion preferences while the shadow feedback remains. Cards gain a quiet layered elevation per theme.
- The README preview is regenerated.

## [1.7.5] - 2026-07-10

### Fixed

- The menu's hover state no longer turns grey, and no longer sticks. Hovering used a grey panel tone that clashed with the brand language, and on phones a tap glued that grey pill to the last-tapped item because touch browsers keep a sticky hover. Hover styling now only applies on devices with a real pointer and uses a faint chartreuse brand tint, while the active item keeps the stronger chartreuse wash and always wins when it is both hovered and active.
- The active menu item now also carries `aria-current`, so screen readers hear which section you are in, kept in sync with the highlight by the same scroll logic.

## [1.7.4] - 2026-07-10

### Changed

- Light mode brings the brand home. The signature chartreuse #abcf37 button with dark ink text, the same button dark mode has always had, is now the primary action in light mode too, and chartreuse drives the accent washes, the menu band, the page glow, and the decorative scene. The airy cream background and crisp white cards return, links use a fresh deep green that passes AA on every chartreuse wash, and the verdict colors return to the vivid set with bright washes. Every rendered text pair measures 4.5:1 or better on the live page (the brand button measures above 10:1), and the dark theme is untouched.
- The README preview is regenerated for the new palette.

## [1.7.3] - 2026-07-10

### Changed

- Light mode now uses the studio palette chosen from design references: sand background #EEE3CF, warm ivory cards, coral #FE6E54 primary buttons with dark ink text (mirroring dark mode's dark-on-chartreuse buttons), a deep coral accent for links and highlights, sage #93A86C washes with the dark green #375554 as success text, a pale gold #FCDB99 wash under warning pills, teal #40A5A0 washes with indigo #363D6E as info text, and a coral, sage, and teal decorative scene. Every rendered text pair measures 4.5:1 or better on the live page, and the dark theme is untouched.
- The README preview is regenerated for the new palette.

## [1.7.2] - 2026-07-10

### Changed

- Light mode is redesigned around a warm editorial palette inspired by premium product sites: terracotta coral becomes the accent for buttons, links, and highlights, the success wash turns sage, the danger red deepens toward crimson so it stays clearly apart from the coral, type warms one step browner, the menu band turns soft sage, and the decorative scene (orbs, spheres, cube wireframes) moves to coral, sage, and warm brown. The cream background and the whole dark theme are untouched, and every rendered text pair measures 4.5:1 or better on the live page.
- The README preview is regenerated for the new light palette.

## [1.7.1] - 2026-07-10

### Fixed

- Restored the suite's visual identity that the previous release had trimmed: the ambient background scene with its orbs and spheres, the original header headline and voice, the hero illustration theming, and the light and dark split-screen README preview. The functional, accessibility, security, and test improvements from that release are all kept.

### Changed

- Light mode's palette is rebuilt around fresh hues instead of darkened earth tones. The accent is now a vivid deep green, success is emerald, the warning orange is clear instead of brown, and the red is brighter. Chip and pill washes are tinted from bright brand colors rather than from the dark text colors, so they read as lively pastels instead of a gray film, and the light-mode decorative constants (page glow, cube wireframes, spheres) moved from olive to brand chartreuse. Every rendered text pair was re-measured at 4.5:1 or better on the live page; dark mode is untouched.
- The README preview is regenerated to show the new light palette beside dark mode.

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

[1.7.58]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.58
[1.7.57]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.57
[1.7.56]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.56
[1.7.55]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.55
[1.7.54]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.54
[1.7.53]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.53
[1.7.52]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.52
[1.7.51]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.51
[1.7.50]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.50
[1.7.49]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.49
[1.7.48]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.48
[1.7.47]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.47
[1.7.46]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.46
[1.7.45]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.45
[1.7.44]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.44
[1.7.43]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.43
[1.7.42]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.42
[1.7.41]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.41
[1.7.40]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.40
[1.7.39]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.39
[1.7.38]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.38
[1.7.37]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.37
[1.7.36]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.36
[1.7.35]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.35
[1.7.34]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.34
[1.7.33]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.33
[1.7.32]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.32
[1.7.31]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.31
[1.7.30]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.30
[1.7.29]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.29
[1.7.28]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.28
[1.7.27]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.27
[1.7.26]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.26
[1.7.25]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.25
[1.7.24]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.24
[1.7.23]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.23
[1.7.22]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.22
[1.7.21]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.21
[1.7.20]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.20
[1.7.19]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.19
[1.7.18]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.18
[1.7.17]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.17
[1.7.16]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.16
[1.7.15]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.15
[1.7.14]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.14
[1.7.13]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.13
[1.7.12]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.12
[1.7.11]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.11
[1.7.10]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.10
[1.7.9]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.9
[1.7.8]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.8
[1.7.7]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.7
[1.7.6]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.6
[1.7.5]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.5
[1.7.4]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.4
[1.7.3]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.3
[1.7.2]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.2
[1.7.1]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.7.1
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
[1.5.5]: https://github.com/JaydenYoonZK/package-reality-check/releases/tag/v1.5.5
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
