# Contributing

The highest-value contributions, roughly in order:

1. **Real phantom sightings.** If an AI tool suggested a package that turned out not to exist (or worse, existed and was malicious), open an issue with the name and where it was suggested. Recurring names may be worth adding to a published dataset.
2. **Parsing gaps.** A `requirements.txt` construct or import form the parser misses.
3. **Python import mappings.** Add stable import-to-distribution mappings, such as `PIL` to `Pillow`, with a test and a primary package reference.
4. **Popular-package list updates.** The typo check compares against `POPULAR_NPM` and `POPULAR_PYPI` in [`docs/checker.js`](docs/checker.js). Additions should be genuinely widely installed packages.
5. **New ecosystems.** Cargo, RubyGems, Go modules. The registry needs a CORS-friendly JSON API for the browser tool to work without a proxy; note that in the issue if you have checked.

## Development

No build step, no dependencies. Parsing and verdict logic live in `docs/checker.js`; shared registry requests live in `docs/registry.js`.

```bash
npm test         # run the suite
npm run serve    # local server on :8322
```

Changes to parsing or verdict logic need a test in [`test/checker.test.mjs`](test/checker.test.mjs).

## Updating the Python stdlib list

The list is generated from CPython itself, not written by hand:

```bash
python3 -c "import sys, json; print(json.dumps(sorted(n for n in sys.stdlib_module_names if not n.startswith('_') or n == '__future__')))"
```

Keep the trailing supplement of removed-in-3.12/3.13 modules; older codebases still import them.

## Pull requests

Small, focused pull requests are easiest to review. Open an issue before starting a structural change.
