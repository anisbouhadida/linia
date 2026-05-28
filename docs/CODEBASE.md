# CODEBASE.md — Linia Maintainer Handoff

This document maps the current codebase for maintainers. It complements the product and architecture documents rather than replacing them.

## Core Boundaries

Linia is split into three TypeScript workspaces:

- `packages/shared` is the API contract boundary. It owns exported enums, DTOs, response envelopes, and error codes shared by API and web.
- `apps/api` is the server-authoritative NestJS backend. It validates requests, enforces business rules, persists data through Prisma, and returns shared DTO shapes.
- `apps/web` is the Angular client. It manages UI state, sends credentials with API requests, and renders server-authoritative state.

When a contract changes, update `packages/shared`, the NestJS implementation, Angular callers, tests, and `docs/API_CONTRACT.md` together.

## Backend Map

The API uses global validation and error normalization from `AppModule`.

- `api-errors/` converts class-validator and Nest exceptions into Linia's `{ error: { code, message, details } }` envelope.
- `config/` validates environment variables at startup. Production sessions must use the PostgreSQL session store.
- `database/` owns Prisma client lifecycle and the idempotent admin seed helper.
- `auth/` owns local session authentication with Passport. The safe user shape must never expose password hashes.
- `templates/` owns planning-time template and task CRUD. It trims user text, assigns task order, validates parent template existence, and maps Prisma records into shared DTOs.

Controllers should stay thin. Put persistence rules, normalization, and domain checks in services. Keep API responses aligned with `ApiDataResponse` and `ApiListResponse` from `packages/shared`.

## Frontend Map

The web app uses Angular standalone components and Bootstrap-based styling.

- `app.config.ts` registers routes, browser error listeners, and the credentials interceptor.
- `auth/credentials.interceptor.ts` sets `withCredentials` so the browser sends Linia's HTTP-only session cookie.
- `auth/auth.service.ts` mirrors the server session into Angular signals for guards and layout state.
- `auth/auth.guard.ts` calls `/auth/me` before protected routes and redirects anonymous users to `/login`.
- `planning/planning.service.ts` is the HTTP facade for template and task operations.
- `planning/planning.page.ts` owns planning UI state, forms, loading/error flags, and local state updates after successful mutations.

Angular may disable controls or show optimistic UI hints, but server state remains authoritative. Do not move dependency, evidence, audit, or status-transition enforcement exclusively into the client.

## MVP Constraints

These constraints are architectural guardrails, not temporary suggestions:

- No WebSockets, Socket.IO, Server-Sent Events, Redis pub/sub, or queues for realtime behavior.
- No backend file uploads. CSV import uses text in JSON, and evidence is text-only.
- No multi-tenancy, organization/workspace scoping, tenant middleware, or SaaS billing assumptions.
- No complex RBAC, public signup, invites, teams, or permission matrices.
- Audit entries are append-only. Do not add audit mutation endpoints or UI.

## Change Guidance

Prefer small, boring changes that preserve the MVP loop:

1. Update the relevant contract document before changing behavior.
2. Keep shared DTOs explicit and stable.
3. Add server-side validation or domain enforcement before relying on Angular affordances.
4. Add or update focused tests near the behavior being changed.
5. Re-run the smallest useful verification command, then broaden to workspace builds/tests when practical.

For the current roadmap and acceptance criteria, use `docs/TODO.md`.
