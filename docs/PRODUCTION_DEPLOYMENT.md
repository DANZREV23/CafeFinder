# Production Deployment Guide

This guide describes the steps to deploy CafeFinder to a production environment using Nginx as a reverse proxy and Systemd for process management.

## 1. Prerequisites

- Ubuntu 22.04+ server
- Node.js 20+ installed (via NVM recommended)
- PostgreSQL 14+ installed and running
- Nginx installed
- Domain name with DNS A records pointing to the server IP

## 2. Server Architecture

```text
                    INTERNET
                       |
                    HTTPS :443
                       |
                    Nginx (Reverse Proxy)
                       |
                localhost:3000
                       |
                 Node / Express (CafeFinder)
                       |
              +--------+--------+
              |                 |
           Prisma            Uploads
              |          (/var/www/CafeFinder/shared/uploads)
           PostgreSQL
         localhost:5432
```

## 3. Directory Structure

We recommend the following directory structure:

```text
/var/www/CafeFinder/
├── current -> releases/20260923000000
├── releases/
│   └── 20260923000000/
└── shared/
    ├── .env
    ├── uploads/
    └── backups/
```

## 4. Environment Configuration

Create the production `.env` file in `/var/www/CafeFinder/shared/.env`. Use the `.env.example` as a template.

```bash
# Example shared .env content
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/cafefinder"
CLIENT_URL="https://yourdomain.com"
SESSION_SECRET="your-very-long-random-secret"
UPLOAD_DIR="/var/www/CafeFinder/shared/uploads"
```

## 5. Build and Release

1. Clone the repository to the `releases` directory.
2. Install dependencies: `npm install --omit=dev`
3. Generate Prisma client: `npx prisma generate`
4. Build the application: `npm run build`
5. Link the `shared/uploads` and `shared/.env`:
   ```bash
   ln -s /var/www/CafeFinder/shared/.env .env
   ln -s /var/www/CafeFinder/shared/uploads uploads
   ```
6. Update the `current` symlink:
   ```bash
   ln -sfn /var/www/CafeFinder/releases/$(date +%Y%m%d%H%M%S) /var/www/CafeFinder/current
   ```

## 6. Systemd Service

Create `/etc/systemd/system/cafefinder.service`:

```ini
[Unit]
Description=CafeFinder Production Server
After=network.target postgresql.service

[Service]
Type=simple
User=sdn
WorkingDirectory=/var/www/CafeFinder/current
Environment=NODE_ENV=production
EnvironmentFile=/var/www/CafeFinder/shared/.env
ExecStart=/usr/bin/node /var/www/CafeFinder/current/dist/server.cjs
Restart=on-failure
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cafefinder
sudo systemctl start cafefinder
```

## 7. Nginx Configuration

Create `/etc/nginx/sites-available/cafefinder`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and test Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/cafefinder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
