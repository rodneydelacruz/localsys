# Barangay Records System

A barangay document management system built with React + PocketBase.

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS (shadcn/ui)
- **Backend**: PocketBase (Go, embedded SQLite, REST API)
- **Auth**: Email/password with role-based access (Admin, Staff, Viewer)
- **Offline**: IndexedDB write queue — queues data when connection drops, auto-flushes on reconnect
- **Hosting**: Cloudflare Tunnel + optional Litestream backup to Cloudflare R2

---

## Architecture

```
                         ┌──────────────────────────────┐
                         │       Cloudflare Network      │
                         │  CDN · WAF · DDoS Protection  │
                         └──────┬───────────────────────┘
                                │
                     ┌──────────┴──────────┐
                     │  cloudflared tunnel  │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     │   localhost:8090     │
                     │   PocketBase         │
                     │   ├── pb_data/       │
                     │   │   └── data.db ◄──┤── Litestream ──► Cloudflare R2
                     │   └── pb_public/     │
                     │       └── (SPA)      │
                     └─────────────────────┘
```

Both the API (`/api/*`) and the SPA (everything else) are served by PocketBase on the same port. The Cloudflare Tunnel exposes `localhost:8090` to the internet.

### Smart URL resolution

The app automatically picks the best API URL:

| Scenario | What happens |
|---|---|
| Phone on cellular (HTTPS) | Uses tunnel URL directly (mixed-content blocked otherwise) |
| Desktop on office LAN (HTTP) | Pings the server's LAN IP — if reachable, uses that |
| Remote desktop (HTTP) | Pings LAN IP → timeout → falls back to tunnel |

This is handled in `src/lib/apiConfig.ts`.

---

## Prerequisites

### Hardware

- **Server PC**: A Windows PC in the barangay office that stays on 24/7. This runs PocketBase + cloudflared.
- **Router**: Must assign a **static LAN IP** to the server PC (e.g., `192.168.1.100`). Do this in the router's DHCP reservation settings.

### Accounts

- **Cloudflare account** (free) — manages DNS and the tunnel. You need a domain on Cloudflare.
- **GitHub account** (free) — hosts the code and runs auto-deploy via GitHub Actions.

### Software to install on the server PC

| Software | Why |
|---|---|
| [PocketBase](https://pocketbase.io) | Backend server with embedded database |
| [Node.js](https://nodejs.org) | To build the React frontend |
| [Git](https://git-scm.com) | To pull code updates |
| [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | Cloudflare Tunnel client |

---

## Step 1: Set up the domain and Cloudflare

### 1a. Add your domain to Cloudflare

If you have a domain (e.g., `barangay.gov.ph`), add it to Cloudflare and point the nameservers.

### 1b. Create a DNS subdomain

Pick a subdomain for the system (e.g., `records.barangay.gov.ph`). The tunnel will route this to your server.

---

## Step 2: Set up Cloudflare Tunnel

### 2a. Install cloudflared

**Windows**:
1. Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Extract `cloudflared.exe` to `C:\Program Files (x86)\cloudflared\cloudflared.exe`

### 2b. Authenticate cloudflared

```powershell
cloudflared tunnel login
```

This opens a browser — log in to your Cloudflare account and authorize the domain.

### 2c. Create the tunnel

```powershell
cloudflared tunnel create barangay-system
```

Save the **tunnel UUID** and the **credentials file path** it outputs.

### 2d. Configure tunnel routes

Create `C:\ProgramData\cloudflared\config.yml`:

```yml
tunnel: <TUNNEL_UUID>
credentials-file: C:\ProgramData\cloudflared\<TUNNEL_UUID>.json
ingress:
  - hostname: records.barangay.gov.ph
    service: http://localhost:8090
  - service: http_status:404
```

### 2e. Route DNS through the tunnel

```powershell
cloudflared tunnel route dns barangay-system records.barangay.gov.ph
```

### 2f. Install cloudflared as a Windows service

```powershell
cloudflared.exe service install <TUNNEL_TOKEN>
Start-Service cloudflared
```

The tunnel token is found in the Cloudflare dashboard → Zero Trust → Access → Tunnels.

### 2g. Verify

Visit `https://records.barangay.gov.ph/_/` — you should see the PocketBase admin login.

---

## Step 3: Set up PocketBase

### 3a. Install PocketBase

1. Download PocketBase for Windows from https://pocketbase.io
2. Place `pocketbase.exe` in the project root: `D:\BARANGAYCC\barangay-system\pocketbase.exe`

> **Important**: The executable is gitignored — everyone downloads their own copy.

### 3b. Run PocketBase as a Windows service

Use **WinSW** (Windows Service Wrapper) so PocketBase starts on boot and can be restarted with `Restart-Service`:

1. Download `WinSW-x64.exe` from https://github.com/winsw/winsw/releases
2. Rename it to `pocketbase-service.exe` and place it in the project root
3. Create `pocketbase-service.xml` in the same directory:

```xml
<service>
  <id>PocketBase</id>
  <name>PocketBase</name>
  <description>PocketBase backend for Barangay Records System</description>
  <executable>D:\BARANGAYCC\barangay-system\pocketbase.exe</executable>
  <arguments>serve --http=localhost:8090 --dir="D:\BARANGAYCC\barangay-system\pb_data" --migrationsDir="D:\BARANGAYCC\barangay-system\pocketbase\pb_migrations"</arguments>
  <startmode>Automatic</startmode>
  <stoptimeout>15 sec</stoptimeout>
  <logpath>D:\BARANGAYCC\barangay-system\logs</logpath>
  <logmode>rotate</logmode>
</service>
```

4. Install and start:

```powershell
pocketbase-service.exe install
pocketbase-service.exe start
```

### 3c. Verify PocketBase is running

```powershell
Get-Service PocketBase
# Should show: Running

curl.exe http://localhost:8090/api/health
# Should return: {"message":"API is healthy.","code":200,"data":{}}
```

### 3d. Set up admin account

1. Visit `http://localhost:8090/_/` or `https://records.barangay.gov.ph/_/`
2. Create the initial admin account

### 3e. Create user accounts

Admins are separate from app users. Create user accounts in the **Users** collection via the admin UI.

---

## Step 4: Build and deploy the frontend

### 4a. Install Node.js dependencies

```powershell
cd D:\BARANGAYCC\barangay-system
npm install
```

### 4b. Configure environment variables

Create `.env.production` in the project root:

```
VITE_API_URL=https://records.barangay.gov.ph
VITE_LOCAL_API_URL=http://192.168.1.100:8090
```

Replace `192.168.1.100` with the server's actual static LAN IP.

> This file is gitignored — it stays on the server and never gets pushed to GitHub.

### 4c. Build and copy to PocketBase

```powershell
npm run build -- --mode production
Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force
```

PocketBase serves everything in `pb_public/` as static files at the root URL.

### 4d. Restart PocketBase

```powershell
Restart-Service PocketBase
```

### 4e. Verify

Visit `https://records.barangay.gov.ph/` — you should see the login page.

---

## Step 5: Set up auto-deploy via GitHub

This lets you push code from anywhere and the server updates itself automatically.

### 5a. Create a GitHub repository

1. Go to https://github.com/new
2. Create a repo (e.g., `barangay-system`)

### 5b. Initialize git and push

If this is a fresh setup:

```powershell
cd D:\BARANGAYCC\barangay-system
git init
git add .
git commit -m "Initial commit"
git branch -m main
git remote add origin https://github.com/YOUR_USER/barangay-system.git
git push -u origin main
```

### 5c. Install a self-hosted GitHub runner

The runner is a background service on the server that listens for pushes and runs the deploy script.

1. Go to your repo on GitHub → **Settings** → **Actions** → **Runners** → **New self-hosted runner**
2. Select **Windows** and follow the on-screen commands:

```powershell
mkdir C:\actions-runner; cd C:\actions-runner
# Download the runner package (use the URL from GitHub)
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/... -OutFile actions-runner-win-x64-*.zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-*.zip", "$PWD")
# Configure
.\config.cmd --url https://github.com/YOUR_USER/barangay-system --token YOUR_TOKEN
# Install as service
.\run.cmd --startuptype windows_service
```

### 5d. The deploy workflow

The file `.github/workflows/deploy.yml` already exists in the repo:

```yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: [self-hosted, windows]
    steps:
      - name: Pull & build in project directory
        run: |
          cd D:\BARANGAYCC\barangay-system
          git pull origin main
          npm ci
          npm run build -- --mode production
          Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force
          Restart-Service -Name PocketBase -Force
```

**How it works**: On every push to `main`, the runner:

1. `cd`s into the project directory on the server
2. `git pull`s the latest code
3. Installs dependencies via `npm ci`
4. Builds the frontend with the production config
5. Copies the build to `pb_public/`
6. Restarts PocketBase to pick up changes

> **Note**: `.env.production` and `pocketbase.exe` are gitignored and stay on the server. The build reads `.env.production` from the local filesystem.

---

## Step 6: Database backup with Litestream + R2 (optional)

### 6a. Create an R2 bucket

1. Cloudflare Dashboard → R2 → Create Bucket
2. Name: `barangay-db-backup`
3. Region: Automatic

### 6b. Create an R2 API token

1. R2 → Account Details → Manage API Tokens
2. Create API Token → **Object Read & Write**
3. Scope to bucket `barangay-db-backup`
4. Copy the **Access Key ID** and **Secret Access Key**

### 6c. Install Litestream

Download from https://github.com/benbjohnson/litestream/releases

### 6d. Edit `litestream.yml`

```yml
dbs:
  - path: D:\BARANGAYCC\barangay-system\pb_data\data.db
    replicas:
      - url: s3://barangay-db-backup.r2.cloudflarestorage.com/pocketbase
        access-key-id: <R2_ACCESS_KEY_ID>
        secret-access-key: <R2_SECRET_ACCESS_KEY>
        endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 6e. Run Litestream

**As a service (recommended)**:

Use WinSW the same way as PocketBase:

```powershell
winsw install Litestream "litestream.exe" "replicate -config D:\BARANGAYCC\barangay-system\litestream.yml"
winsw start Litestream
```

**Verify**:

```powershell
litestream databases -config litestream.yml
```

### 6f. Restore from backup

If the database is lost on a new machine:

```powershell
# Stop PocketBase first
litestream restore -o pb_data\data.db s3://barangay-db-backup.r2.cloudflarestorage.com/pocketbase
```

---

## Local development

### Prerequisites

- Node.js
- PocketBase binary in the project root

### Setup

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` should contain:

```
VITE_API_URL=http://localhost:8090
```

### Start PocketBase

```bash
pocketbase serve --http=127.0.0.1:8090
```

### Start the dev server

```bash
npm run dev
```

The Vite dev server runs on port 8080 and proxies API calls to PocketBase on 8090.

---

## Project structure

```
src/
  api/          - PocketBase client, typed wrappers, error handling
  auth/         - Login, session, role-based guards
  offline/      - IndexedDB queue, sync manager, offline indicator
  features/     - Domain features (records, settings)
  components/   - Shared UI (shadcn/ui components)
  routes/       - Route definitions
  lib/          - API config, health check, export utilities
pocketbase/
  pb_hooks/     - JS hooks (rate limiting, audit log)
  pb_migrations/ - Collection definitions + RBAC rules
scripts/        - Deploy, export, health check scripts
.github/workflows/ - GitHub Actions auto-deploy
```

---

## Troubleshooting

### "Something went wrong" on login

This is the PocketBase SDK's fallback error. It usually means the app can't reach the server.

**On the same WiFi (desktop):**
- Open browser DevTools → Network tab → see which URL the POST goes to
- If it's the tunnel URL but you're on LAN, the local IP in `.env.production` might be wrong
- Run `ipconfig` on the server, check the correct IPv4 address, and update `.env.production`

**On the phone (cellular):**
- Make sure you're on HTTPS (the tunnel)
- Hard-refresh the browser (clear cache) after deploying

### Tunnel returns 503

- Check that cloudflared is running: `Get-Service cloudflared`
- Check the tunnel status in the Cloudflare dashboard
- Verify the config.yml has the correct tunnel UUID and hostname
- Make sure PocketBase is running on port 8090

### `Restart-Service PocketBase` fails

- PocketBase must be installed as a service via WinSW, not running as a manual process
- Check: `Get-Service PocketBase`
- If stopped: `pocketbase-service.exe start`
- If missing: reinstall with `pocketbase-service.exe install`

### Build succeeds but changes don't appear

- The build copies to `pb_public/` but PocketBase caches static files
- You need to restart PocketBase: `Restart-Service PocketBase`
- Hard-refresh the browser (Ctrl+Shift+R or clear cache)

---

## Quick reference

### Deploy manually

```powershell
.\scripts\deploy.ps1 production
```

### Deploy via GitHub

Just push to `main`:

```bash
git add .
git commit -m "My changes"
git push origin main
```

### Check server health

```powershell
curl.exe http://localhost:8090/api/health
# or remotely:
curl.exe https://records.barangay.gov.ph/api/health
```

### Restart PocketBase

```powershell
Restart-Service PocketBase
```

### View PocketBase logs

```powershell
Get-Content D:\BARANGAYCC\barangay-system\logs\*.log
```
