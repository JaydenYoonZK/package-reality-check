# Security Policy

## Reporting a vulnerability

If you find a security issue in Package Reality Check, please report it privately rather than opening a public issue.

Use GitHub's private vulnerability reporting on this repository: choose "Report a vulnerability" under the Security tab.

You can expect an acknowledgment within 72 hours. Please include steps to reproduce and, if you have one, a suggested fix.

## Scope

The interesting attack surface of this tool is untrusted input: manifests and source files it parses, and package names it prints or places into registry URLs. Reports about parsing hangs (ReDoS), terminal escape injection, URL or path injection through crafted names, and anything that makes the tool report a false "all clear" are all very much in scope.

## Supported versions

Only the latest release is supported. The tool has zero runtime dependencies by design; if you find that no longer true, that is also a bug worth reporting.
