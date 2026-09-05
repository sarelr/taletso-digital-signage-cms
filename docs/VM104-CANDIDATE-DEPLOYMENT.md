# VM104 Phase 2 candidate deployment

This procedure installs the Phase 2 candidate beside the working Phase 1 player. It does not overwrite `/opt/cyrus/stacks/cms-tv/player`, stop `tdcp-screen-player`, or modify Nginx Proxy Manager.

> **Current development network (22 August 2026):** VM104 is `192.168.0.118`, PostgreSQL is `192.168.0.117`, VM101 is `192.168.0.116`, and the pilot TV remains `192.168.0.4` pending a newer TV network record. Confirm these values locally before deployment because production addressing will be assigned by Taletso ICT.

## Addresses

| Service | Address |
| --- | --- |
| Phase 1 baseline | `http://192.168.0.118:8082` |
| Phase 2 administration | `http://192.168.0.118:8083` |
| Phase 2 candidate player | `http://192.168.0.118:8083/player` |

## 1. Prepare the archive on the ThinkCentre

Run in PowerShell without placing secrets in the project:

```powershell
Set-Location -LiteralPath 'C:\Projects\Taletso-TDCP'
.\scripts\prepare-phase2-candidate.ps1
```

The script packages tracked and approved untracked source files, excludes ignored environment files and dependency/build directories, and prints a SHA-256 checksum.

Transfer it using the administrator's existing SSH configuration. Replace only the username placeholder; authenticate interactively or with the administrator's locally managed SSH key:

```powershell
scp C:\Projects\tdcp-phase2-candidate.tar.gz <vm104-admin-user>@192.168.0.118:/tmp/
ssh <vm104-admin-user>@192.168.0.118
```

Do not put a password in either command or a script.

## 2. Extract without touching Phase 1

Run on VM104:

```sh
sudo install -d -m 0750 /opt/cyrus/stacks/cms-tv/phase2-candidate
sudo tar -xzf /tmp/tdcp-phase2-candidate.tar.gz -C /opt/cyrus/stacks/cms-tv/phase2-candidate
cd /opt/cyrus/stacks/cms-tv/phase2-candidate
sudo test -f /opt/cyrus/stacks/cms-tv/.env
sudo chmod 600 /opt/cyrus/stacks/cms-tv/.env
```

The candidate uses the existing protected `/opt/cyrus/stacks/cms-tv/.env` directly through Docker Compose. Do not copy, print, or duplicate it. `DATABASE_URL` must target `192.168.0.117:5432`, `AUTH_URL` should be `http://192.168.0.118:8083` for LAN acceptance or the approved HTTPS hostname for external administration, and `XIBO_MODE=mock` remains valid for the direct-player architecture.

The database URL must point to the administrator-configured PostgreSQL service. Do not paste its password into chat, command history, or source control.

## 3. Guarded candidate installation

Run:

```sh
cd /opt/cyrus/stacks/cms-tv/phase2-candidate
sudo sh scripts/deploy-phase2-candidate.sh
```

After a VM restart or infrastructure change, first run the secret-safe inspection:

```sh
cd /opt/cyrus/stacks/cms-tv/phase2-candidate
sudo sh scripts/inspect-vm104-state.sh
```

The script:

- verifies the exact deployment directory;
- verifies that Phase 1 and `tdcp-screen-player` remain present;
- rejects insecure or placeholder environment values;
- refuses another service already using port 8083;
- copies Phase 1 into the isolated `player-runtime` directory only;
- records and rechecks Phase 1 hashes;
- builds the candidate image;
- applies the Prisma migration and seed;
- starts only `tdcp-phase2-candidate`;
- checks the administration and player endpoints.

## 4. Verify side-by-side operation

```sh
curl -fsS http://127.0.0.1:8082/ >/dev/null
curl -fsS http://127.0.0.1:8083/api/health
curl -fsS http://127.0.0.1:8083/player >/dev/null
docker ps --filter name=tdcp-screen-player --filter name=tdcp-phase2-candidate
sha256sum -c phase1-baseline.sha256
```

## 5. One-time candidate commissioning

Before the acceptance test, load this URL once on SCREEN-001 using the normal TV browser or approved kiosk startup configuration:

```text
http://192.168.0.118:8083/player?screenId=SCREEN-001
```

This one-time commissioning step is unavoidable: a TV still polling the isolated Phase 1 URL on port 8082 cannot receive candidate configuration from port 8083. ADB is not required and should not be a production dependency.

After the candidate player is visible, do not refresh or interact with the TV during the acceptance test.

## 6. Acceptance test

1. Open `http://192.168.0.118:8083` on the administration workstation.
2. Sign in with the locally seeded administrator account.
3. Open **Screens** and confirm `SCREEN-001` and its current assignment.
4. Select the other approved SVG asset.
5. Click **Publish to Screen 001** once.
6. Confirm a successful publication message and audit record.
7. Confirm the Skyworth changes automatically within approximately 10 seconds.
8. Publish the first asset again and confirm the second automatic change.
9. Do not edit JSON manually and do not touch or refresh the TV during steps 4–8.

## Rollback

Phase 1 remains available throughout at `http://192.168.0.118:8082`. If candidate testing fails:

```sh
cd /opt/cyrus/stacks/cms-tv/phase2-candidate
sudo docker compose -f docker-compose.candidate.yml stop tdcp-phase2-candidate
```

Return SCREEN-001 to the Phase 1 URL using the normal TV/kiosk commissioning method. No Phase 1 files need restoration because the candidate never mounts them.
