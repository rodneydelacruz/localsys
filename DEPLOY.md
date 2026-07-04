# Deployment Guide

## Prerequisites

- A domain on Cloudflare (e.g. `barangay.yourdomain.com`)
- A Cloudflare account (free plan is sufficient)
- The server running PocketBase (Windows or Linux)

---

## Step 1: Set Up Cloudflare Tunnel

### 1a. Install `cloudflared`

**Windows**: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
Extract `cloudflared.exe` to a permanent location (e.g. `C:\cloudflared\`).

**Linux**:
```sh
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### 1b. Authenticate

```sh
cloudflared tunnel login
```

This opens a browser — log in to your Cloudflare account and authorize the domain.

### 1c. Create the tunnel

```sh
cloudflared tunnel create barangay-system
```

Save the tunnel UUID and the credentials JSON file path it outputs.

### 1d. Configure ingress rules

Create `C:\Users\<you>\.cloudflared\config.yml` (Linux: `~/.cloudflared/config.yml`):

```yml
tunnel: <TUNNEL_UUID>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL_UUID>.json
ingress:
  - hostname: app.barangay.yourdomain.com
    service: http://localhost:8090
  - service: http_status:404
```

### 1e. Route DNS to the tunnel

```sh
cloudflared tunnel route dns barangay-system app.barangay.yourdomain.com
```

### 1f. Install as a service

**Windows** (admin PowerShell):
```powershell
cloudflared.exe service install <TUNNEL_TOKEN>
Start-Service cloudflared
```

**Linux**:
```sh
sudo cloudflared service install <TUNNEL_TOKEN>
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 1g. Verify

Visit `https://app.barangay.yourdomain.com/_/` — you should see the PocketBase admin UI.
Visit `https://app.barangay.yourdomain.com/` — you should see your SPA.

---

## Step 2: Configure Production Environment Variables

Edit `.env.production` (or create if missing):

```
VITE_API_URL=https://app.barangay.yourdomain.com
VITE_LOCAL_API_URL=http://192.168.0.100:8090
```

Replace `192.168.0.100` with your server's actual LAN IP address.

### How the local detection works

The code in `src/lib/apiConfig.ts` already handles this:

1. On production builds, the app tries to fetch `{LOCAL_API_URL}/api/health` with a 3-second timeout
2. If reachable → uses local URL (zero latency, works offline)
3. If unreachable → falls back to the tunnel URL (remote access)

The `VITE_LOCAL_API_URL` env var is what triggers this logic. If it's empty (like in dev), the app just uses `VITE_API_URL` directly.

---

## Step 3: Build & Deploy the Frontend

```powershell
# Build for production
npm run build -- --mode production

# The output goes to dist/
# Copy to pb_public so PocketBase serves it
Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force
```

**Why this works**: PocketBase automatically serves static files from the `pb_public/` directory at the root URL. The SPA is served alongside the API at the same hostname.

---

## Step 4: Set Up Litestream + R2 Backup

### 4a. Create an R2 bucket

1. Go to Cloudflare Dashboard → R2 → Create Bucket
2. Name: `barangay-db-backup`
3. Select region (e.g. Automatic)

### 4b. Create an R2 API token

1. In R2 → Account Details → Manage API Tokens
2. Create API Token → **Object Read & Write**
3. Scope to bucket `barangay-db-backup`
4. Copy the **Access Key ID** and **Secret Access Key**

### 4c. Install Litestream

**Windows**: Download from https://github.com/benbjohnson/litestream/releases
Extract `litestream.exe` to a permanent location.

**Linux**:
```sh
curl -L https://github.com/benbjohnson/litestream/releases/latest/download/litestream-linux-amd64 -o /usr/local/bin/litestream
chmod +x /usr/local/bin/litestream
```

### 4d. Create Litestream config

Create `litestream.yml` in the project root:

```yml
dbs:
  - path: D:\BARANGAYCC\barangay-system\pb_data\data.db
    replicas:
      - url: s3://barangay-db-backup.r2.cloudflarestorage.com/pocketbase
        access-key-id: <R2_ACCESS_KEY_ID>
        secret-access-key: <R2_SECRET_ACCESS_KEY>
        endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Replace `<ACCOUNT_ID>` with your Cloudflare account ID (found in dashboard → Workers & Pages).

### 4e. Run Litestream

**Manually**:
```powershell
litestream replicate -config litestream.yml
```

**As a Windows service** (using NSSM):
```powershell
nssm install Litestream "litestream.exe" "replicate -config D:\BARANGAYCC\barangay-system\litestream.yml"
nssm start Litestream
```

**As a Linux systemd service**:
```sh
sudo systemctl edit --force --full litestream
```
```ini
[Unit]
Description=Litestream
After=network.target

[Service]
ExecStart=/usr/local/bin/litestream replicate -config /path/to/litestream.yml
Restart=always
User=youruser

[Install]
WantedBy=multi-user.target
```
```sh
sudo systemctl enable --now litestream
```

### 4f. Verify backup

```powershell
litestream databases -config litestream.yml
```

You should see your database listed with the replica URL.

---

## Step 5: Restore from Backup (Disaster Recovery)

If you need to restore the database on a new machine:

```powershell
# Stop PocketBase first, then:
litestream restore -o pb_data\data.db s3://barangay-db-backup.r2.cloudflarestorage.com/pocketbase
```

Or restore to a specific generation:

```powershell
litestream restore -o pb_data\data.db --replica s3://<...> --generation <generation-id>
```

---

## Step 6: Testing vs Production

| Env  | Build Command               | API URL                     | Local Fallback           |
|------|-----------------------------|-----------------------------|--------------------------|
| Dev  | `npm run dev`               | `http://localhost:8090`     | None (direct only)       |
| Prod | `npm run build -- --mode production` | Tunnel URL | LAN IP on same network   |

To add a **staging** environment:

1. Create `.env.staging`:
   ```
   VITE_API_URL=https://staging.barangay.yourdomain.com
   VITE_LOCAL_API_URL=http://192.168.0.101:8090
   ```

2. Build with:
   ```powershell
   npm run build -- --mode staging
   ```

3. Run a second PocketBase instance on a different port + data dir:
   ```powershell
   pocketbase.exe serve --http=localhost:8091 --dir=pb_data_staging
   ```

4. Create a second Cloudflare Tunnel pointing `staging.barangay.yourdomain.com` → `localhost:8091`

---

## Step 7: Deploy Script (Automation)

Create `scripts/deploy.ps1`:

```powershell
param(
  [ValidateSet('production', 'staging')]
  [string]$Env = 'production'
)

Write-Host "Building for $Env..."
npm run build -- --mode $Env

Write-Host "Copying to pb_public..."
Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force

Write-Host "Done! Restart PocketBase to pick up changes."
```

Then run:

```powershell
.\scripts\deploy.ps1 production
```

---

## Architecture Summary

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
                    │       └── index.html │
                    └─────────────────────┘

LAN Users: http://192.168.0.100:8090 (direct, 0ms latency)
Remote:   https://app.barangay.yourdomain.com (via tunnel)
```
