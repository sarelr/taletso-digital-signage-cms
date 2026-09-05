#!/usr/bin/env sh
set -eu

EXPECTED_ROOT="/opt/cyrus/stacks/cms-tv/phase2-candidate"
PHASE1_ROOT="/opt/cyrus/stacks/cms-tv/player"
COMPOSE_FILE="docker-compose.candidate.yml"

CURRENT_ROOT=$(pwd -P)
if [ "$CURRENT_ROOT" != "$EXPECTED_ROOT" ]; then
  echo "Refusing deployment outside $EXPECTED_ROOT" >&2
  exit 1
fi
if [ ! -f "$COMPOSE_FILE" ] || [ ! -f "Dockerfile" ]; then
  echo "Candidate deployment files are incomplete." >&2
  exit 1
fi
if [ ! -f "$PHASE1_ROOT/index.html" ] || [ ! -f "$PHASE1_ROOT/screen-001.json" ]; then
  echo "The Phase 1 baseline was not found; nothing has been changed." >&2
  exit 1
fi
ENV_FILE="/opt/cyrus/stacks/cms-tv/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "The protected parent environment file $ENV_FILE was not found." >&2
  exit 1
fi
if find "$ENV_FILE" -perm /077 -print -quit | grep -q .; then
  echo "Refusing an environment file readable or writable by group/other. Run: chmod 600 $ENV_FILE" >&2
  exit 1
fi
if grep -Eq 'replace-|tdcp-management-host|postgres-host' "$ENV_FILE"; then
  echo "Replace all placeholder values in the protected parent environment file before deployment." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker is unavailable to the current administrator." >&2
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -qx 'tdcp-screen-player'; then
  echo "The Phase 1 tdcp-screen-player container is not running; deployment stopped." >&2
  exit 1
fi
PHASE1_BEFORE=$(sha256sum "$PHASE1_ROOT/index.html" "$PHASE1_ROOT/screen-001.json")
printf '%s\n' "$PHASE1_BEFORE" > phase1-baseline.sha256
if ! docker ps -a --format '{{.Names}}' | grep -qx 'tdcp-phase2-candidate' && ss -ltn | grep -Eq '[:.]8083[[:space:]]'; then
  echo "Port 8083 is already occupied by another service." >&2
  exit 1
fi

install -d -m 0750 player-runtime backups
if [ -n "$(find player-runtime -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  if [ ! -f "player-runtime/.phase2-candidate-copy" ]; then
    echo "player-runtime contains an unrecognized workset; refusing to overwrite it." >&2
    exit 1
  fi
else
  cp -a "$PHASE1_ROOT/." player-runtime/
  : > player-runtime/.phase2-candidate-copy
fi
# Install versioned candidate brand assets only into the isolated Phase 2 runtime.
# Phase 1 remains under $PHASE1_ROOT and is never used as the destination.
if [ -d "player/phase2-candidate/media" ]; then
  install -d -m 0750 player-runtime/media
  for asset in player/phase2-candidate/media/*; do
    [ -f "$asset" ] || continue
    install -m 0640 "$asset" "player-runtime/media/$(basename "$asset")"
  done
fi
chown -R 1001:1001 player-runtime backups
chmod -R u=rwX,g=rX,o= player-runtime backups

docker compose -f "$COMPOSE_FILE" config --quiet
docker compose -f "$COMPOSE_FILE" build tdcp-phase2-candidate tdcp-phase2-tools
docker compose -f "$COMPOSE_FILE" --profile tools run --rm tdcp-phase2-tools npx prisma migrate status
docker compose -f "$COMPOSE_FILE" --profile tools run --rm tdcp-phase2-tools npx prisma migrate deploy
docker compose -f "$COMPOSE_FILE" --profile tools run --rm tdcp-phase2-tools node prisma/seed.mjs
docker compose -f "$COMPOSE_FILE" up -d tdcp-phase2-candidate

attempt=0
until wget -q --spider http://127.0.0.1:8083/api/health; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Candidate health check did not pass. Phase 1 remains untouched on port 8082." >&2
    docker compose -f "$COMPOSE_FILE" logs --tail=100 tdcp-phase2-candidate
    exit 1
  fi
  sleep 2
done
wget -q --spider http://127.0.0.1:8083/player

PHASE1_AFTER=$(sha256sum "$PHASE1_ROOT/index.html" "$PHASE1_ROOT/screen-001.json")
if [ "$PHASE1_BEFORE" != "$PHASE1_AFTER" ]; then
  echo "Phase 1 baseline changed during candidate deployment. Stop and investigate immediately." >&2
  exit 1
fi

APP_ADDRESS=$(hostname -I | awk '{print $1}')
echo "TDCP Phase 2 candidate is healthy at http://$APP_ADDRESS:8083"
echo "Phase 1 remains running at http://$APP_ADDRESS:8082"
echo "Before acceptance, commission SCREEN-001 once to http://$APP_ADDRESS:8083/player?screenId=SCREEN-001"
