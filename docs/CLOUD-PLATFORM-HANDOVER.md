# TDCP cloud platform handover

## Target model

```text
Taletso Base44 app
       │ public read-only feeds
       ▼
TDCP cloud platform (GitHub → Vercel + Supabase)
       │ approved playlists and player configuration
       ▼
TV browser/player
```

Base44 remains the client-facing source for announcements, gallery images, public feed posts and live streams. TDCP imports those records as drafts, retains its approval and scheduling workflow, and supplies the TV-facing player configuration. Content is entered once in Base44; it is never silently published to screens.

## Source control and release flow

1. Development changes are committed and pushed to the TDCP GitHub repository.
2. Vercel creates a preview deployment for review.
3. The database migration is applied to the linked Supabase PostgreSQL project.
4. The preview is tested using the Base44 public feeds and a non-production player URL.
5. The reviewed Vercel deployment is promoted to production.
6. In Base44, add a visible **Digital Signage** link or tab pointing to the production TDCP URL. It is a normal browser link; no Base44 database credential is required.

## Required cloud configuration

Vercel needs the following environment values in its protected project settings:

- `DATABASE_URL`: Supabase PostgreSQL connection string, server-side only.
- `AUTH_SECRET` and `AUTH_URL`: TDCP authentication configuration.
- `BASE44_PUBLIC_APP_URL`: the Taletso Base44 public domain.
- `BASE44_INTEGRATION_SECRET` and `BASE44_IMPORT_OWNER_EMAIL`: only if the optional inbound integration endpoint is enabled.

Do not expose a Supabase service role key, database password, Base44 token, or TDCP secret through `NEXT_PUBLIC_` variables, Base44 records or GitHub.

## Hosting readiness note

The current candidate player uses VM-local media/configuration files. That design is correct for the office VM but cannot be deployed unchanged to Vercel because serverless filesystems are temporary. Before the production Vercel cutover, move player media and generated configuration from the local filesystem to Supabase Storage and database-backed configuration. TV browsers can then load the player directly from the Vercel production URL and do not require a TDCP server at the client premises.

## Base44 connection

The existing Base44 functions expose read-only content feeds at the public Base44 app domain:

- `getPublicAnnouncements`
- `getPublicGalleryImages`
- `getPublicFeedPosts`
- `getPublicLiveStreams`

TDCP pulls these feeds from its own server-side sync action. This avoids storing a Base44 developer credential in TDCP and allows the client to keep working in their familiar Base44 app.
