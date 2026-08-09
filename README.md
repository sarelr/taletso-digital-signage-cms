# Taletso Digital Signage CMS

Standalone enterprise signage management foundation for Taletso TVET College.

## Phase 1 scope

- Responsive dashboard and operational modules for 12 displays across four locations.
- PostgreSQL domain model through Prisma.
- Auth.js server authentication boundary and role/campus access helpers.
- Six-method server-only Xibo adapter contract with mock implementation.
- Docker development and production build configuration.

## Local setup

1. Copy `.env.example` to `.env` and replace all placeholder secrets.
2. Run `npm install`.
3. Start PostgreSQL with `docker compose up db -d`.
4. Run `npx prisma migrate dev --name initial` and `npm run dev`.

Do not use real Xibo credentials in client components or variables prefixed with
`NEXT_PUBLIC_`. The mock adapter is the only Phase 1 implementation.

## Roles

Cyrus Technical Administrator, Taletso Super Administrator, Communications
Administrator, Campus Content Manager, Contributor, Approver, and Viewer.
Campus-scoped roles must always query through the assigned `locationId`.

## Content workflow

`Draft → Pending Approval → Approved → Scheduled → Published → Archived`

The `canApproveContent` access helper enforces four-eye control: contributors
cannot approve content they own.
