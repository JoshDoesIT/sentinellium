<p align="center">
  <img src="docs/logo.png" alt="Sentinellium" width="120" />
</p>

<h1 align="center">Sentinellium</h1>

<p align="center">
  <strong>The Client-Side, Privacy-Preserving AI Defense Grid</strong><br>
  <em>Intelligence at the edge. Privacy at the core.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/version-0.1.0-cyan.svg" alt="Version" />
  <img src="https://img.shields.io/badge/engines-3-green.svg" alt="Engines" />
  <img src="https://img.shields.io/badge/tests-passing-brightgreen.svg" alt="Tests" />
</p>

---

A WebGPU-accelerated browser extension that runs AI security inference directly on the user's GPU. Zero cloud dependency, zero added latency, complete privacy. Paired with an enterprise management console for fleet-wide threat visibility.

## Architecture

```
sentinellium/
├── apps/
│   ├── extension/     # Chrome/Edge extension (WXT + React 19)
│   ├── console/       # Enterprise dashboard (Next.js 16)
│   └── docs/          # Documentation site
├── packages/
│   ├── engines/       # Shared engine classes (alert, fleet, dashboard)
│   ├── api-client/    # Typed API client for frontend consumption
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared UI components
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TS configuration
├── services/
│   └── api/           # Backend API (Hono)
└── docs/              # Reference documents
```

## Core Engines

| Engine                | Purpose                                      | Technology                |
| --------------------- | -------------------------------------------- | ------------------------- |
| **Context Engine**    | Real-time semantic phishing detection        | ONNX Runtime Web + WebGPU |
| **Provenance Engine** | C2PA deepfake defense and media verification | C2PA JS SDK               |
| **DLP Engine**        | Shadow AI data leakage prevention            | Microsoft Presidio (WASM) |

## Enterprise Console

The management console provides fleet-wide visibility and enterprise security features:

- **SOC Dashboard** — Real-time threat metrics, engine health, trend analysis
- **Alert Investigation** — Unified feed with severity filtering, search, and detail views
- **Fleet Management** — Monitor all extension instances across the organization
- **Threat Timeline** — Temporal analysis with hourly/daily bucketing and trend detection
- **Geographic Intelligence** — TLD-based threat origin heatmaps
- **Audit Log** — Full compliance trail with actor, action, and IP tracking
- **User Management** — RBAC (Admin/Analyst/Viewer), MFA enforcement
- **Authentication** — MFA with TOTP, SSO (SAML/OAuth) support
- **Compliance** — SOC 2, GDPR, HIPAA framework support

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the extension in dev mode (auto-opens Chrome)
cd apps/extension && pnpm dev

# Start the enterprise console
cd apps/console && pnpm dev

# Run all tests
pnpm test:run

# Type check
pnpm check-types

# Lint
pnpm lint
```

## Tech Stack

| Layer               | Technology                 |
| ------------------- | -------------------------- |
| Extension Framework | WXT (Vite-based)           |
| Extension UI        | React 19 + TypeScript      |
| AI Inference        | ONNX Runtime Web (WebGPU)  |
| Enterprise Console  | Next.js 16 (App Router)    |
| API                 | Hono                       |
| Database            | Prisma + PostgreSQL        |
| Styling             | Vanilla CSS (Brand System) |
| Testing             | Vitest + Playwright        |
| Monorepo            | Turborepo + pnpm           |

## Development

This project follows **strict Test-Driven Development** (TDD). Every feature begins with a failing test. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow.

### Branch Protection

All PRs to `main` require:

- All CI checks passing (lint, typecheck, test, build)
- CodeQL security scan passing

## License

MIT
