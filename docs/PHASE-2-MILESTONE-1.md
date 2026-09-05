# Phase 2 Milestone 1 deployment checkpoint

> **Current scope and evidence boundary (13 August 2026):** The approved estate is 12 screens (`SCREEN-001` through `SCREEN-012`). Older 14-screen material is retained only as superseded planning context. The proven Phase 1 SCREEN-001 player, its backups, service and port 8082 must remain unchanged. Source tests or a healthy candidate service do not complete this milestone: acceptance still requires evidence from the physical TV on the live Taletso network.

> **Current development network (22 August 2026):** VM104 is `192.168.0.118`, PostgreSQL is `192.168.0.117`, VM101 is `192.168.0.116`, and the pilot TV remains `192.168.0.4` pending a newer TV network record. These remain environment-specific development addresses and must not be embedded as production assumptions.

> **Physical evidence update (21 August 2026):** A supplied photograph shows SCREEN-001 physically rendering the CMS media-test page with a visible `MEDIA DELIVERY: ONLINE` indicator. The operator subsequently confirmed the TV was using the Phase 2 player and that heartbeat/online telemetry works. After the 22 August address change, recommission SCREEN-001 at `http://192.168.0.118:8083/player?screenId=SCREEN-001`. The portal-driven two-change acceptance sequence and matching persistence/audit evidence remain outstanding. See `PROJECT-TASKS.md` for the current task register.

> **Additional physical evidence (22 August 2026):** A second supplied photograph shows the physical display rendering the Taletso TVET College branded communications slide. It is archived at `docs/evidence/screen-001-taletso-content-2026-08-22.jpg`. This adds evidence of a second content state, but does not alone establish the timing or no-interaction portal publish sequence.

## Implemented in source

- Authenticated Screen 001 publishing from the portal.
- Approved media records for the two proven SVG assets.
- Phase 1-compatible JSON generation.
- Atomic configuration replacement and per-screen publication lock.
- Previous-valid-configuration backup and database publication history.
- Audit event recording with actor, screen, content and configuration version.
- Player configuration API with no-store caching.
- Separate last-known-good player candidate.

## Safe deployment order

1. Resolve dependencies and complete all local verification gates.
2. Apply the new Prisma migration to a non-production TDCP database.
3. Run the seed with locally configured administrator values.
4. Copy the Phase 1 `player` directory to a sandbox directory.
5. Set `TDCP_PLAYER_ROOT` and `TDCP_BACKUP_ROOT` to sandbox paths.
6. Verify both media publications, backups, audit records and rollback behavior.
7. Compare the generated JSON with the live Phase 1 contract.
8. Deploy the admin service without changing the live player.
9. Schedule the physical Screen 001 test and take a fresh player backup.
10. Grant the container write access only to the player configuration and backup paths.
11. Publish one approved asset and confirm automatic TV change within approximately 10 seconds.
12. Retain the original player until the separate last-known-good candidate passes TV validation.

## External prerequisites

- A PostgreSQL `DATABASE_URL` configured outside source control.
- Auth and seed secrets configured locally; credentials must not be sent through chat.
- VM104 deployment access through an approved operator or deployment mechanism.
- A test window with physical Screen 001 available.

## Side-by-side candidate addresses

- Phase 1 baseline: `http://192.168.0.118:8082` — remains untouched.
- Phase 2 administration: `http://192.168.0.118:8083`.
- Phase 2 candidate player: `http://192.168.0.118:8083/player?screenId=SCREEN-001`.

The candidate writes only to `/opt/cyrus/stacks/cms-tv/phase2-candidate/player-runtime`. It does not mount or modify `/opt/cyrus/stacks/cms-tv/player`.

SCREEN-001 must be commissioned once to load the candidate player URL before the no-interaction acceptance test. A TV still running the Phase 1 URL on port 8082 cannot observe the isolated candidate configuration on port 8083.
