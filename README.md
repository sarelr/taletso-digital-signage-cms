# Taletso Digital Signage CMS

Standalone enterprise signage management foundation for Taletso TVET College.

## Production-ready foundation

- Responsive dashboard and operational modules for 12 displays across four locations.
- PostgreSQL domain model through Prisma.
- Auth.js credentials authentication against bcrypt password hashes, protected portal routes, and role/campus access helpers.
- Persisted and audited first-TV commissioning workflow.
- Six-method server-only Xibo adapter with explicit mock and live OAuth modes.
- Docker development and production build configuration.

## Local setup

1. Copy `.env.example` to `.env` and replace all placeholder values.
2. Run `npm install`.
3. Start PostgreSQL with `docker compose up db -d`.
4. Run `npm run db:deploy` and `npm run db:seed`.
5. Remove `SEED_ADMIN_PASSWORD` from the runtime environment after seeding.
6. Run `npm run dev`.

Do not use real Xibo credentials in client components or variables prefixed with
`NEXT_PUBLIC_`. Keep `XIBO_MODE=mock` outside controlled integration environments;
production readiness requires `XIBO_MODE=live` and credentials for a confidential
Xibo client-credentials application.

## Release procedure

1. Run `npm ci` and `npm run verify` on a clean checkout.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `XIBO_MODE=live`, and the three Xibo connection variables in the deployment secret store.
3. Run `npm run db:deploy` as a one-off release job before starting the new application image.
4. Run `npm run db:seed` only for initial provisioning, using a unique password supplied through the secret store.
5. Confirm `/api/health` returns HTTP 200 and `/api/ready` returns HTTP 200.
6. Sign in, save a commissioning update, refresh the page, and confirm the value and corresponding audit event persist.
7. Verify the connected Xibo display reports online before approving controlled playback.

The image runs as a non-root user and includes a database-backed health check.
Database migrations are intentionally a separate release job so multiple application
instances cannot race migrations during startup.

## Roles

Cyrus Technical Administrator, Taletso Super Administrator, Communications
Administrator, Campus Content Manager, Contributor, Approver, and Viewer.
Campus-scoped roles must always query through the assigned `locationId`.

## Content workflow

`Draft → Pending Approval → Approved → Scheduled → Published → Archived`

The `canApproveContent` access helper enforces four-eye control: contributors
cannot approve content they own.
