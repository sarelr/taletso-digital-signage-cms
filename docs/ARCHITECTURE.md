# TDCP architecture

## Infrastructure

- Proxmox host: `192.168.0.10`.
- VM101 `cyrus-proxy01` (`192.168.0.116`): reverse proxy and network entry point.
- VM102 `cyrus-postgres01` (`192.168.0.117:5432`): PostgreSQL database `tdcp_cms`; application role `tdcp_app` is configured privately.
- VM104 `cyrus-app01` (`192.168.0.118`): Next.js CMS, player/config delivery, local media and candidate Docker service on port 8083.
- Physical pilot TV (`192.168.0.4`): commissioned as `SCREEN-001`.
- Production Phase 1 player: `/opt/cyrus/stacks/cms-tv/player`, port 8082. It is not mounted by the candidate.
- Phase 2 candidate: `/opt/cyrus/stacks/cms-tv/phase2-candidate`, port 8083.
- Protected environment: `/opt/cyrus/stacks/cms-tv/.env`; never print or commit it.

## Data flow

```text
Administrator browser -> authenticated TDCP CMS -> PostgreSQL
                                      |
                                      +-> validated media storage
                                      +-> atomic screen-NNN.json publication
                                      +-> audit/publication history

Display player -> /player/screen-NNN.json -> /player/media/<generated file>
       |                    |
       +-> cached LKG       +-> automatic polling
       +-> heartbeat -> CMS Screen.lastHeartbeatAt
```

## Screen identity and scale

One CMS serves all displays. A player is commissioned with:

```text
http://192.168.0.118:8083/player?screenId=SCREEN-001
```

The current approved scope is `SCREEN-001` through `SCREEN-012`. Each screen has an independent database record, current assignment, generated configuration, heartbeat identity and status. Older Phase 2 material described a 14-screen estate; that is historical planning context and is not the current implementation scope. Do not create unconfirmed production screen records merely to reach a target count.

## Media

Uploads accept JPG, PNG, WEBP, safe SVG and MP4 up to 100 MB. File signatures are verified; extensions are not trusted. SVG scripts, event handlers, external references and foreign objects are rejected. Stored filenames are random UUIDs under the candidate `player-runtime/media` directory. Clients never receive arbitrary filesystem paths.

## Base44 content intake

`POST /api/integrations/base44/content` accepts an authenticated reference to an existing Base44 `Announcement`, `GalleryImage`, `LiveStream` or published `PublicFeedPost`. `BASE44_INTEGRATION_SECRET` must be a random value of at least 32 characters and `BASE44_IMPORT_OWNER_EMAIL` must identify an existing TDCP service owner. Credentials stay in the deployment environment and are never stored in Base44 records or source control.

Records are keyed by Base44 source type and record ID, so retries update the same TDCP item instead of creating duplicates. Every change is audited and forced to `DRAFT`; import can never approve, schedule or publish content. The existing four-eye workflow remains authoritative.

Because TDCP is hosted inside the college network, its primary integration direction is outbound: an authorized TDCP operator uses **Settings → Sync Base44 content** to pull from `BASE44_PUBLIC_APP_URL`. This avoids opening an inbound route through the college firewall. The authenticated inbound endpoint remains available for a future approved HTTPS deployment.

## Reliability

- Configuration publication validates the full payload, verifies the media exists, obtains a per-screen lock, backs up the previous valid configuration and atomically renames the new file.
- The player preloads new media before replacing displayed content.
- The player stores the last-known-good configuration locally and continues displaying content during temporary CMS/config/network failures.
- Heartbeats are sent every 30 seconds; the CMS treats a screen as online only for 90 seconds after the most recent heartbeat.

## Xibo

`XIBO_MODE=mock` is valid for the current direct-player architecture. The adapter remains available for future authorized live integration but does not block CMS readiness.
