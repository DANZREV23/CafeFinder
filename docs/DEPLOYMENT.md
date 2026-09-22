# CafeFinder Production Deployment Architecture & Operations Guide

This document defines the production deployment architecture, security model, and operational procedures for **CafeFinder**.

---

## 1. Production Architecture Overview

The production deployment of CafeFinder utilizes a hardened, multi-tier topology:

```
                          [ Public Internet / Clients / CDN ]
                                          │
                                          │ HTTPS (Port 443)
                                          ▼
                       [ Reverse Proxy: Nginx / Cloud Load Balancer ]
                         - TLS/SSL Termination & HTTP/2
                         - Gzip & Brotli Compression
                         - Static Asset Caching (dist/assets/)
                         - Rate Limiting & Request Filtering
                         - Security Headers (HSTS, CSP, X-Frame-Options)
                                          │
                                          │ HTTP (127.0.0.1:3000 / Unix Socket)
                                          ▼
                      [ CafeFinder Node.js / Express Application ]
                         - Managed by systemd (cafefinder.service)
                         - Dedicated unprivileged user: `cafefinder`
                         - Bundled CommonJS: `dist/server.cjs`
                         - Graceful Shutdown (SIGTERM/SIGINT with 30s timeout)
                         - Internal Probes: /api/live, /api/ready, /api/health
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
                     ▼                                         ▼
            [ Prisma ORM Client ]                     [ Shared File Storage ]
          - Connection Pooling & Retries               - Persistent /uploads
          - Unix Socket / Cloud SQL Auth Proxy         - Daily /backups
          - Migration Engine                           - Rotated /logs
                     │
                     ▼
          [ PostgreSQL Database (Private Network) ]
          - Cloud SQL or Dedicated PostgreSQL 15+
          - NEVER exposed to public internet
```

### Key Security & Network Constraints
- **Private Database**: PostgreSQL **must never** listen on public interfaces (`0.0.0.0`). It must be reachable only via localhost, internal VPC network, or authenticated Unix socket proxy.
- **Unprivileged Runtime**: The Node.js application runs strictly under the dedicated `cafefinder` system account with `NoNewPrivileges=true` and restricted filesystem permissions.
- **Atomic Pre-Deploy Backups**: A full database backup is automatically captured before any migration is deployed to prevent irreversible schema corruption.

---

## 2. Infrastructure Requirements

| Component | Minimum Specification | Recommended Production |
| :--- | :--- | :--- |
| **Node.js** | v20.10.0 LTS | v20.x or v22.x LTS |
| **PostgreSQL** | PostgreSQL 15 | PostgreSQL 16 (Cloud SQL / Managed) |
| **CPU / Memory** | 1 vCPU / 1 GB RAM | 2 vCPU / 4 GB RAM |
| **Disk Storage** | 20 GB SSD (NVMe) | 50 GB+ SSD with auto-grow |
| **Reverse Proxy** | Nginx 1.20+ | Nginx with TLS 1.3 |
| **Process Manager**| systemd | systemd with watchdog |

---

## 3. Production Directory Structure

In standard single-server deployments or release-managed symlinked deployments, maintain the following directory layout:

```
/home/cafefinder/
├── app/                      # Base application root (or current -> releases/release_X)
│   ├── current -> releases/release_20260921_120000
│   ├── dist/                 # Compiled client assets & server.cjs
│   ├── release.json          # Active release manifest
│   ├── node_modules/         # Production dependencies
│   ├── prisma/               # Schema and migration SQL files
│   └── package.json
│
├── shared/                   # Persistent data preserved across all deployments
│   ├── .env                  # Production environment secrets (chmod 600)
│   ├── uploads/              # User-uploaded cafe images & avatars
│   ├── backups/              # Automated database & file snapshots
│   └── logs/                 # Application activity & error logs
│
└── releases/                 # Release history for instant rollback
    ├── release_20260921_120000/
    ├── release_20260920_180000/
    └── release_20260919_090000/
```

---

## 4. End-to-End Automated Deployment Workflow

The deployment automation script enforces this exact sequential pipeline:

```
  ┌───────────────────────┐
  │ 1. Acquire Lock       │  --> Prevents concurrent deployment conflicts (.deployment.lock)
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 2. Preflight Checks   │  --> Validates Node 20+, .env variables, DB connection, directories
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 3. Pre-Deploy Backup  │  --> Full database snapshot before migration (Aborts if backup fails)
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 4. Build Application  │  --> Generates Vite client, esbuild server.cjs, release.json
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 5. Migration Safety   │  --> Scans SQL for DROP TABLE/COLUMN, TRUNCATE, ALTER COLUMN
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 6. Apply Migrations   │  --> Runs `prisma migrate deploy` (Never `prisma db push`)
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 7. Restart Service    │  --> Dispatches `systemctl restart cafefinder` with graceful drain
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 8. Health Checks &    │  --> Probes /api/live, /api/ready, /api/health, public cafes API
  │    Smoke Tests        │
  └──────────┬────────────┘
             ▼
  ┌───────────────────────┐
  │ 9. Finalize & Cleanup │  --> Retains recent releases (default 3), releases lock, logs audit
  └───────────────────────┘
```

### Running Automated Deployment

```bash
# Execute preflight check only
npm run deploy:check

# Execute full automated deployment pipeline
npm run deploy

# Execute standalone deployment verification
npm run deploy:verify

# Execute rollback to previous release
npm run rollback
```

---

## 5. Systemd Service Configuration

Save to `/etc/systemd/system/cafefinder.service`:

```ini
[Unit]
Description=CafeFinder Production Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=cafefinder
Group=cafefinder
WorkingDirectory=/home/cafefinder/app
Environment=NODE_ENV=production
EnvironmentFile=/home/cafefinder/app/.env
ExecStart=/usr/bin/node dist/server.cjs

# Process management & graceful restart
Restart=always
RestartSec=5
RestartPreventExitStatus=0
KillSignal=SIGTERM
TimeoutStopSec=30

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cafefinder

# Security sandbox
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadOnlyPaths=/
ReadWritePaths=/home/cafefinder/app/uploads
ReadWritePaths=/home/cafefinder/app/logs
ReadWritePaths=/home/cafefinder/app/backups
ReadWritePaths=/home/cafefinder/app

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cafefinder
sudo systemctl start cafefinder
sudo systemctl status cafefinder
```

---

## 6. Reverse Proxy Configuration (Nginx)

Save to `/etc/nginx/sites-available/cafefinder`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

server {
    listen 80;
    listen [::]:80;
    server_name cafefinder.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cafefinder.example.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/cafefinder.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cafefinder.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max upload size (for cafe photos)
    client_max_body_size 10M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/json application/javascript;

    # Static Assets (Compiled Frontend with long-lived cache)
    location /assets/ {
        alias /home/cafefinder/app/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Uploaded Media (Cached with revalidation)
    location /uploads/ {
        alias /home/cafefinder/app/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }

    # Authentication rate limiting
    location /api/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # General API Routes
    location /api/ {
        limit_req zone=api_limit burst=40 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA Fallback & Static HTML
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 7. Zero-Downtime vs Minimal-Downtime Realities

### Honest Architectural Truth
- **Single-Server systemd**: When running a single Node.js process managed by systemd, executing `systemctl restart cafefinder` creates a **brief transition window of 1 to 3 seconds** while the existing process finishes in-flight requests and the new process initializes.
- **Nginx Buffering**: Nginx will queue requests during the brief restart if `proxy_next_upstream` and connection retry parameters are configured.
- **True Zero-Downtime (Multi-Instance)**: For zero-downtime, the infrastructure must run at least two application instances (e.g., ports 3000 and 3001, or Docker Swarm / Kubernetes pods) behind an Nginx upstream group with rolling health-checked reload:
  ```nginx
  upstream cafefinder_cluster {
      server 127.0.0.1:3000 max_fails=3 fail_timeout=10s;
      server 127.0.0.1:3001 max_fails=3 fail_timeout=10s;
  }
  ```

---

## 8. Maintenance Mode Handling

During major data transformations or destructive database maintenance, enable Maintenance Mode to protect data integrity:

1. **Via Admin Panel**: Navigate to **Admin Panel > System > System Status** and toggle **Maintenance Mode**.
2. **Via API**:
   ```bash
   curl -X POST http://127.0.0.1:3000/api/admin/system/maintenance \
     -H "Content-Type: application/json" \
     -H "Cookie: token=YOUR_ADMIN_SESSION" \
     -d '{"enabled": true}'
   ```
3. **Behavior**:
   - `/api/health` returns `HTTP 503` with status `maintenance`.
   - `/api/live` remains `HTTP 200` (process is healthy).
   - All standard non-admin API requests receive `HTTP 503 Maintenance Mode`.
   - Admin authentication routes remain accessible to allow operators to complete maintenance and toggle mode back off.
