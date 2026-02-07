# Security Policy

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report security vulnerabilities via [GitHub Security Advisories](https://github.com/JoshDoesIT/sentinellium/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Security Measures

- All dependencies are audited on every PR via `pnpm audit`
- CodeQL static analysis runs on every push to `main` and all PRs
- Strict Content Security Policy (CSP) in the browser extension
- No remote code execution (all inference runs locally)
- Zero data exfiltration (no browsing data leaves the device)
