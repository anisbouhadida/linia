# Linia

Linia is a strict single-workspace MVP for high-risk IT cutover checklist execution. It replaces manual spreadsheet-style runbooks with template planning, live task execution, server-enforced dependency blocking, text-only evidence, and an append-only audit trail.

The project is intentionally narrow. Before changing behavior, read the project rules and contracts in this order:

1. [.codex/AGENTS.md](.codex/AGENTS.md)
2. [docs/PRD.md](docs/PRD.md)
3. [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
4. [docs/DATABASE.md](docs/DATABASE.md)
5. [docs/DECISIONS.md](docs/DECISIONS.md)
6. [docs/DESIGN.md](docs/DESIGN.md)
7. [docs/CODEBASE.md](docs/CODEBASE.md)
8. [docs/TODO.md](docs/TODO.md)

## Stack

- Monorepo: pnpm workspaces
- API: NestJS REST API
- Web: Angular standalone components
- Shared contracts: TypeScript package in `packages/shared`
- Database: PostgreSQL
- ORM and migrations: Prisma
- Styling: Bootstrap 5.3 with Linia Sass customization
- Local infrastructure: Docker Compose

## Repository Layout

```text
apps/api/          NestJS API, Prisma schema, seeds, API tests
apps/web/          Angular application and Bootstrap theme entrypoint
packages/shared/   Shared enums and DTO contracts used by API and web
docs/              Product, API, database, architecture, design, and roadmap docs
infra/             Deployment and infrastructure material
scripts/           Project helper scripts
```

## Local Setup

Linia uses Volta-pinned Node and pnpm versions from `package.json`.

```bash
volta install node@24
volta install pnpm
pnpm install
pnpm db:up
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

The API expects environment variables described by `apps/api/src/config/env.validation.ts`. For local development, use a `.env` file based on the project example when present.

## Common Commands

```bash
pnpm dev                  # Run API and web dev servers
pnpm dev:api              # Run only the NestJS API
pnpm dev:web              # Run only the Angular app
pnpm test                 # Run workspace tests
pnpm build                # Build all workspaces
pnpm --filter api test    # Run API unit tests
pnpm --filter web test    # Run web tests
```

## Maintainer Rules

- Keep the API server-authoritative. Angular can guide users, but NestJS must enforce business rules.
- Do not add WebSockets, Socket.IO, Server-Sent Events, Redis pub/sub, or queues for MVP realtime behavior. Use HTTP polling.
- Do not add backend file-upload infrastructure. Evidence and CSV import are text-only.
- Do not add multi-tenancy, organization/workspace tables, tenant middleware, billing, or subdomains.
- Do not add complex RBAC, invite flows, public signup, teams, or permission matrices.
- Do not expose audit update/delete behavior. Audit entries are append-only.
- Keep shared DTO changes synchronized with `docs/API_CONTRACT.md` and both apps.

## Code Map

Use [docs/CODEBASE.md](docs/CODEBASE.md) as the maintainer handoff map for module responsibilities, data flow, and change guidance.
