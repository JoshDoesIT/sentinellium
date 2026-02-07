# Sentinellium

> **The Client-Side, Privacy-Preserving AI Defense Grid**

A WebGPU-accelerated browser extension that runs AI security inference directly on the user's GPU. There is no cloud dependency, no added latency, and complete privacy. It is paired with an enterprise management console for fleet-wide threat visibility.

## Architecture

```
sentinellium/
├── apps/
│   ├── extension/     # Chrome/Edge extension (WXT + React 19)
│   ├── console/       # Enterprise dashboard (Next.js 15)
│   └── docs/          # Documentation site
├── packages/
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared UI components
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TS configuration
├── services/
│   └── api/           # Backend API (Hono + tRPC)
└── docs/              # Reference documents
```

## Core Engines

| Engine                | Purpose                                      | Technology                |
| --------------------- | -------------------------------------------- | ------------------------- |
| **Context Engine**    | Real-time semantic phishing detection        | ONNX Runtime Web + WebGPU |
| **Provenance Engine** | C2PA deepfake defense and media verification | C2PA JS SDK               |
| **DLP Engine**        | Shadow AI data leakage prevention            | Microsoft Presidio (WASM) |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all services in development
pnpm dev

# Run tests (TDD, always test first)
pnpm test:run

# Type check
pnpm check-types

# Lint
pnpm lint

# Full CI pipeline
pnpm ci
```

## Tech Stack

| Layer               | Technology                |
| ------------------- | ------------------------- |
| Extension Framework | WXT (Vite-based)          |
| Extension UI        | React 19 + TypeScript     |
| AI Inference        | ONNX Runtime Web (WebGPU) |
| Enterprise Console  | Next.js 15 (App Router)   |
| API                 | Hono + tRPC               |
| Database            | Prisma + PostgreSQL       |
| Styling             | Tailwind CSS 4            |
| Testing             | Vitest + Playwright       |
| Monorepo            | Turborepo + pnpm          |

## Development

This project follows **strict Test-Driven Development** (TDD). Every feature begins with a failing test. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow.

### Branch Protection

All PRs to `main` require:

- All CI checks passing (lint, typecheck, test, build)
- CodeQL security scan passing

## License

MIT
