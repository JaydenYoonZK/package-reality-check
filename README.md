# Package Reality Check 👻

Check AI-suggested dependencies against npm and PyPI before you install them. Paste a `package.json`, a `requirements.txt`, or code with imports, and find out which packages are real, which are brand new lookalikes, and which were invented outright.

<p>
  <a href="https://jaydenyoonzk.github.io/package-reality-check/"><img src="https://img.shields.io/badge/Live%20tool-open-abcf37?style=for-the-badge&logo=githubpages&logoColor=black" alt="Open the live tool"></a>
  <a href="https://github.com/JaydenYoonZK/package-reality-check/stargazers"><img src="https://img.shields.io/github/stars/JaydenYoonZK/package-reality-check?style=for-the-badge&logo=github" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/JaydenYoonZK/package-reality-check?style=for-the-badge" alt="MIT License"></a>
</p>

<a href="https://jaydenyoonzk.github.io/package-reality-check/?demo">
  <img src="docs/assets/preview.png" alt="Package Reality Check flagging two invented packages from an AI-generated requirements.txt, with did-you-mean hints" width="100%">
</a>

**[Open the live tool](https://jaydenyoonzk.github.io/package-reality-check/)** or **[see it catch phantoms in a sample](https://jaydenyoonzk.github.io/package-reality-check/?demo)**. Checks run from your browser straight against the public registries. Your code goes nowhere else.

## Why this exists

Code assistants hallucinate package names. A [2024 study of 576,000 generated code samples](https://arxiv.org/abs/2406.10279) found that nearly one in five suggested packages did not exist, across more than 200,000 unique invented names. Because models repeat themselves, the same phantom names come up again and again, and attackers have started registering them with malicious payloads. The security community calls it slopsquatting.

The defense is boring and effective: look the package up before you install it. This tool does that for a whole dependency list at once.

## What it does

- Parses `package.json` (every dependency field), `requirements.txt` (specifiers, extras, environment markers), and raw JS/TS or Python source with imports
- Skips Node built-ins and the Python standard library, including modules removed in recent Python versions such as `telnetlib`
- Queries npm and PyPI directly from your browser (both registries send CORS headers, so no proxy ever sees your input)
- Flags packages that do not exist, packages registered in the last 120 days, low-download packages, deprecated packages, and names within typo distance of several hundred popular packages
- Explains every verdict in plain language, with a link to the registry page

## Use it

No install: [jaydenyoonzk.github.io/package-reality-check](https://jaydenyoonzk.github.io/package-reality-check/)

Run locally:

```bash
git clone https://github.com/JaydenYoonZK/package-reality-check.git
cd package-reality-check
npm run serve   # http://localhost:8322
```

## Use the engine in your own project

Parsing, stdlib filtering, typo distance, and verdict logic live in a single dependency-free ES module, [`docs/checker.js`](docs/checker.js). Network calls are separate, so the module works anywhere:

```js
import { extract, verdict, registryUrls } from "./checker.js";

const { kind, deps } = extract(sourceOrManifestText);
// fetch registryUrls(dep.name, dep.ecosystem).api yourself, then:
const result = verdict(dep.name, dep.ecosystem, { exists, createdAt, downloads });
```

## Tests

```bash
npm test
```

15 tests cover manifest parsing, import extraction, stdlib filtering, PEP 503 normalization, typo distance, and every verdict path.

## Limitations worth knowing

- Only npm and PyPI. Other ecosystems are tracked in [issues](https://github.com/JaydenYoonZK/package-reality-check/issues).
- Internal/private packages will show as PHANTOM, because the tool can only see public registries. That is also a nudge to protect those names.
- Edit distance cannot read intent; occasional legitimate near-name packages will ask you for thirty seconds of judgment.

## License

MIT. Built and maintained by [Jayden Yoon ZK](https://github.com/JaydenYoonZK). Sibling project: [AI Paste Cleaner](https://github.com/JaydenYoonZK/ai-paste-cleaner).
