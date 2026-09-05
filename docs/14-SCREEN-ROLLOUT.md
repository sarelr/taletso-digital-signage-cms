# TDCP 14-screen rollout (superseded planning context)

> **Historical document — do not use for deployment:** This records an older 14-screen proposal. The current approved and executable scope is exactly 12 screens (`SCREEN-001` through `SCREEN-012`). Use `VM104-CANDIDATE-DEPLOYMENT.md` for current instructions. Do not seed, commission, deploy or report screens 013-014 unless Taletso formally approves a scope change.

Do not create or commission all screen records until Taletso confirms each display's identifier, site and physical location. The application code is shared; no CMS or player code is copied per screen.

## Naming

- Use stable identifiers `SCREEN-001` through `SCREEN-014`.
- Record a human-readable name and assigned `Location` in PostgreSQL.
- Do not use the IP or MAC address as the primary identity.
- The first heartbeat binds a generated device UUID to the screen record. Rebinding requires an authorized database/administration operation and audit evidence.

## Player commissioning

Each TV uses the shared endpoint with its own ID:

```text
http://192.168.0.118:8083/player?screenId=SCREEN-002
```

Replace the suffix for each confirmed screen. After commissioning, verify:

1. the TV retrieves `/player/screen-NNN.json`;
2. the assigned media returns HTTP 200;
3. a heartbeat appears within 30 seconds;
4. the CMS shows online within the 90-second window;
5. publishing to that screen does not change any other screen;
6. cached content remains visible during a temporary application outage;
7. the player reconnects when the service returns.

## Staged rollout

1. Complete and sign off SCREEN-001 acceptance.
2. Register one confirmed display per campus and repeat the full acceptance test.
3. Register the remaining confirmed displays in small batches.
4. Reuse approved media from the central library; do not duplicate files unnecessarily.
5. Confirm wired LAN, kiosk auto-start, display power recovery and heartbeat for every device.
6. Export or record the screen/site/device inventory and commissioning evidence.
7. Retain Phase 1 rollback until all 14 displays have passed sustained operation.

## Scheduling

The existing Prisma model supports playlists, ordered playlist items, date-bounded schedules and screen groups. Scheduling remains a database foundation until its portal actions and player playlist execution receive separate acceptance testing. Do not represent this foundation as operational scheduling.
