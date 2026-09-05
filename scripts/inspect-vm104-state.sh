#!/usr/bin/env sh
set -eu

ROOT="/opt/cyrus/stacks/cms-tv"
echo "HOST $(hostname)"
echo "IP $(hostname -I | awk '{print $1}')"
echo "MEMORY"
free -h
echo "DISK"
df -h "$ROOT"
echo "TDCP DIRECTORIES"
for directory in "$ROOT/player" "$ROOT/phase2-candidate"; do
  if [ -d "$directory" ]; then echo "PRESENT $directory"; else echo "MISSING $directory"; fi
done
if [ -f "$ROOT/.env" ]; then
  mode=$(stat -c '%a' "$ROOT/.env")
  echo "ENV PRESENT mode=$mode"
else
  echo "ENV MISSING"
fi
echo "CONTAINERS"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo "PORTS"
ss -ltn | awk 'NR==1 || /:8082 |:8083 |:8084 /'
echo "PHASE1 HTTP"
if wget -q --spider http://127.0.0.1:8082/; then echo "PHASE1_OK"; else echo "PHASE1_UNAVAILABLE"; fi
echo "CANDIDATE HTTP"
if wget -q --spider http://127.0.0.1:8083/api/health; then echo "CANDIDATE_OK"; else echo "CANDIDATE_NOT_RUNNING"; fi
echo "DATABASE TCP"
database_host=$(sed -n 's|^DATABASE_URL=.*@\([^:/]*\).*|\1|p' "$ROOT/.env" | head -n 1)
if [ -z "$database_host" ]; then
  echo "DATABASE_TCP_FAILED (host unavailable from protected environment)"
elif nc -z -w 3 "$database_host" 5432; then
  echo "DATABASE_TCP_OK host=$database_host"
else
  echo "DATABASE_TCP_FAILED host=$database_host"
fi
echo "No environment values were printed."
