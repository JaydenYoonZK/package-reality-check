# Security Policy

## Reporting a vulnerability

If you find a security issue in Package Reality Check, please report it privately rather than opening a public issue.

Use [GitHub's private vulnerability reporting form](https://github.com/JaydenYoonZK/package-reality-check/security/advisories/new).

Include steps to reproduce, the affected code path, expected impact, and any suggested remediation.

## Scope

The primary attack surface is untrusted input: manifests and source files, terminal output, and package names placed into registry URLs. Parsing hangs, terminal injection, URL or path injection, and false clean results are in scope.

## Supported versions

Security fixes are assessed against the latest release. Older versions may not receive patches. The CLI and Action have no third-party runtime dependencies.
