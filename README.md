# Barangay System

Frontend codebase for the Barangay office management system.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS (shadcn/ui)
- **Backend**: PocketBase (REST API + embedded SQLite) running on the office PC
- **Auth**: PocketBase email/password auth with RBAC (Admin, Staff, Viewer)
- **Offline**: IndexedDB-backed write queue via `idb` — queues writes when offline, flushes on reconnect

### Build Targets

| Target | Build Env | API URL Source | Port |
|--------|-----------|----------------|------|
| Local (office PC) | `.env.local` | `http://localhost:8090` | 8080 |
| Cloud (Vercel/CF Pages) | `.env.production` | Tunnel public hostname | 80/443 |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file for local development
cp .env.local.example .env.local

# Start dev server (port 8080)
npm run dev
```

### PocketBase

1. Download PocketBase for your OS from [pocketbase.io](https://pocketbase.io)
2. Place the binary in the project root (or your PATH)
3. Run migrations:

```bash
./pocketbase migrate --migrationsDir=./pocketbase/pb_migrations
```

4. Start PocketBase:

```bash
./pocketbase serve --http=127.0.0.1:8090
```

## Project Structure

```
src/
  api/          - PocketBase client, typed wrappers, error handling
  auth/         - Login, session, role-based guards
  offline/      - IndexedDB queue, sync manager, offline indicator
  features/     - Domain features (records placeholder)
  components/   - Shared UI (shadcn/ui components)
  routes/       - Route definitions
  lib/          - Env config, health check, export utilities
pocketbase/
  pb_hooks/     - PocketBase JS hooks (rate limiting, audit log)
  pb_migrations/ - Collection definitions + RBAC rules
scripts/        - Export and health check shell scripts
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | PocketBase base URL (local or tunnel) |

## Scripts

```bash
npm run dev      # Start dev server on port 8080
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Offline Queue

Write operations (create/update/delete) are wrapped to detect network failures. When offline:

1. The write is stored in IndexedDB (`barangay-offline-queue`)
2. An optimistic local result is returned
3. A badge appears in the bottom-right showing queue count
4. On `online` event or manual "Sync now" click, the queue is flushed in order

## Deployment

### Cloud Build

```bash
cp .env.production.example .env.production
# Edit .env.production with your tunnel hostname
npm run build
# Deploy dist/ to Vercel or Cloudflare Pages
```

### Cloudflare Tunnel

The tunnel hostname is set via `VITE_API_URL` in `.env.production`. No tunnel config is included in this repo — set up `cloudflared` manually:

```bash
cloudflared tunnel create barangay-tunnel
cloudflared tunnel route dns barangay-tunnel your-hostname.example.com
cloudflared tunnel run barangay-tunnel --url http://localhost:8090
```
