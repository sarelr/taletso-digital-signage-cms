# TDCP project task register

Last updated: 22 August 2026

## Evidence received

- **Network address migration verified (22 August 2026).** VM101 is at `192.168.0.116`, VM102 is at `192.168.0.117`, and VM104 is at `192.168.0.118`. PostgreSQL accepts VM104 on `.117:5432`; Phase 2 readiness reports database/configuration healthy on port 8083; Phase 1 remains available on port 8082.
- **Candidate delivery and rollback verification (22 August 2026).** SCREEN-001 configuration validates through the Phase 2 API, its assigned JPEG returns HTTP 200, and the recorded Phase 1 hashes for `index.html` and `screen-001.json` both pass. SCREEN-001's last heartbeat predates the address migration, so physical recommissioning at the `.118` player URL is still required.

- **SCREEN-001 physical display — partial evidence received (21 August 2026).** The supplied photograph visibly shows a physical projection/display rendering `TDCP DIGITAL DISPLAY`, `SCREEN 001 · CMS MEDIA TEST`, and `MEDIA DELIVERY: ONLINE`.
- **SCREEN-001 Taletso branded-content display — additional physical evidence received (22 August 2026).** The second supplied photograph shows the physical display rendering the Taletso TVET College `DIGITAL COMMUNICATIONS PLATFORM` branded slide. The archived evidence file is [`evidence/screen-001-taletso-content-2026-08-22.jpg`](evidence/screen-001-taletso-content-2026-08-22.jpg) (SHA-256 `DDAF3364CD64869C0311A5F9B404C04AB781D8B0E720F0006DCF6D1A1DC9E5B6`).
- This closes the task to obtain basic physical proof that SCREEN-001 can render the media-test page.
- **SCREEN-001 Phase 2 runtime and heartbeat — confirmed before address change (21 August 2026).** The operator confirmed that the TV worked with the Phase 2 player and that the dashboard received its heartbeat/online state. The new VM104 address is `192.168.0.118`; recommissioning and heartbeat reconfirmation are required after this network change.
- This does **not** yet prove the complete two-media automatic publish sequence, database/audit persistence, or any of SCREEN-002 through SCREEN-012.

## Current tasks

| Status | Priority | Task | Completion evidence required |
| --- | --- | --- | --- |
| Complete | P0 | Obtain basic physical rendering evidence for SCREEN-001 | Photo visibly identifying SCREEN-001 and showing the CMS media-test page with an online delivery indicator; received 21 August 2026. |
| Complete | P0 | Identify the photographed runtime as Phase 1 (`:8082`) or Phase 2 candidate (`:8083`) | Operator confirmed the Phase 2 player URL on VM104 port 8083 on 21 August 2026. |
| Pending | P0 | Complete the SCREEN-001 Phase 2 no-interaction publish test | Two physical content states are now photographed, including the Taletso branded slide archived in this repository. Still capture the portal publish actions, timestamps, and proof that both display changes occurred automatically without a TV refresh within approximately 10 seconds. |
| Complete | P0 | Complete the 22 August server network-address migration | PostgreSQL reachable from VM104 at `192.168.0.117:5432`, Phase 2 readiness returns HTTP 200, and Phase 1 remains HTTP 200. Verified 22 August 2026. |
| In progress | P0 | Recommission SCREEN-001 after the address migration | Load `http://192.168.0.118:8083/player?screenId=SCREEN-001` on the pilot TV and confirm a fresh heartbeat within 30 seconds. |
| Pending | P0 | Verify publication persistence and audit trail | Successful portal publication response, matching database publication record, matching audit event, configuration version, and correct state after refresh/restart. |
| Complete | P0 | Verify Phase 1 isolation and rollback baseline | Phase 1 remains healthy on port 8082 and both recorded baseline hashes pass after the Phase 2 deployment. Verified 22 August 2026. |
| Complete | P0 | Confirm SCREEN-001 heartbeat and online-state telemetry | Operator confirmed the Phase 2 player is working and the CMS receives SCREEN-001 heartbeat/online telemetry on 21 August 2026. |
| Pending | P1 | Record the approved 12-screen physical inventory | Confirm identifier, campus/site, physical location, device details, and approved network assignment for SCREEN-001 through SCREEN-012. Do not add SCREEN-013 or SCREEN-014. |
| Pending | P1 | Commission the remaining confirmed displays in controlled batches | Per-screen player URL, media retrieval, heartbeat, isolation, cached playback, reconnection, and power/kiosk recovery evidence. |
| In progress | P1 | Enable secure external administrator access | Application safety gate and runbook prepared. Taletso ICT must supply the VPN route or approved HTTPS hostname, certificate and firewall policy before activation. |
| Complete | P1 | Surface rejected player heartbeats | Candidate player now reports heartbeat rejection and explicitly identifies device recommissioning conflicts instead of silently appearing healthy. |
| Pending | P1 | Run role-based acceptance | Authorized Taletso roles validate campus scoping, content submission, approval, publishing, and audit visibility. |
| Pending | P1 | Complete release verification | Clean dependency install, migrations and seed against the intended database, full verification suite/build, authenticated hosted flow, and recovery checks. |
| Pending | P2 | Obtain operational and governance sign-off | Taletso ICT/network approval, content-owner acceptance, support/rollback ownership, and formal go-live decision. |

## Scope boundary

The executable estate remains exactly 12 screens: `SCREEN-001` through `SCREEN-012`. The received photo is evidence for one physical screen only and must not be used to report the full estate, Phase 2 acceptance, deployment completion, or production go-live as complete.
