# TDCP external administrator access

## Decision

External administration must use HTTPS through Taletso-controlled infrastructure. Do not expose VM104 port 8083, PostgreSQL port 5432, or the Phase 1 player directly to the public Internet.

The preferred production route is:

```text
Authorised administrator
  -> Taletso VPN
  -> VM101 cyrus-proxy01 (192.168.0.116)
  -> VM104 TDCP Phase 2 (192.168.0.118:8083)
```

Current development addresses verified from Proxmox on 22 August 2026 are VM101 `192.168.0.116`, VM102 `192.168.0.117`, and VM104 `192.168.0.118`. These remain environment configuration, not permanent application identities.

If Taletso ICT approves public reverse-proxy access instead of VPN-only access, VM101 must terminate HTTPS using a real internal or public DNS hostname and a trusted certificate. Restrict the proxy to the administration hostname and forward only to `http://192.168.0.118:8083`. Keep VM104 and PostgreSQL behind the firewall.

## Required local environment

After ICT supplies the final HTTPS hostname, update the protected file `/opt/cyrus/stacks/cms-tv/.env` without committing or displaying it:

```dotenv
AUTH_URL=https://tdcp.example.taletso.internal
AUTH_TRUST_HOST=true
TDCP_EXTERNAL_ACCESS=true
```

Replace the example hostname with the ICT-approved hostname. The deployment readiness endpoint deliberately returns `503` if external access is enabled with an HTTP authentication URL or without reverse-proxy trust.

## VM101 reverse-proxy requirements

- HTTPS only; redirect HTTP to HTTPS.
- TLS 1.2 or newer.
- Forward `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, and the client address.
- Enable WebSocket support.
- Apply login rate limiting at the proxy or firewall.
- Prefer VPN source-address restrictions or an explicit administrator allowlist.
- Do not publish `/api/ready`; restrict monitoring endpoints to the management network.
- Do not proxy port 8082 externally.

## Acceptance checks

1. Connect through the approved VPN or external management path.
2. Open the HTTPS hostname and confirm the browser reports a valid certificate.
3. Sign in as the authorised administrator and verify that an unauthenticated private window is redirected to `/login`.
4. Publish test media to SCREEN-001 and confirm delivery and audit logging.
5. Confirm SCREEN-001 continues heartbeating over its LAN player URL.
6. Confirm direct public access to ports 8082, 8083, and 5432 is blocked.
7. Record the DNS name, certificate owner/expiry, firewall rule owner, VPN group, and rollback procedure in the production handover.

## Information still required from Taletso ICT

- VPN technology and authorised administrator account/group.
- Final management hostname.
- Whether the hostname is internal-only or publicly resolvable.
- Certificate method.
- Firewall/NAT policy and approved source restrictions.

These are infrastructure decisions and must not be guessed or embedded in source code.

## Address-change recovery gate

Before deploying after an address change:

1. PostgreSQL must listen on `192.168.0.117:5432` as well as localhost.
2. `pg_hba.conf` must authorize only the `tdcp_app` role and `tdcp_cms` database from VM104 `192.168.0.118/32` using `scram-sha-256`.
3. The protected VM104 `DATABASE_URL` must use `192.168.0.117:5432`.
4. Recreate only the Phase 2 container so it receives the revised environment.
5. Require `/api/ready` to return HTTP 200 with database and configuration checks true before commissioning a screen.
