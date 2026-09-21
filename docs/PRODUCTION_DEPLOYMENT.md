# CafeFinder Production Deployment Guide

This guide describes the recommended production deployment architecture and procedure for CafeFinder.

## 1. Architecture

The recommended production architecture is:

```
Internet
   ↓
Reverse Proxy (Nginx / Apache / Cloud Load Balancer)
   ↓
Node.js CafeFinder Application (Systemd Managed)
   ↓
Prisma ORM
   ↓
MariaDB Database (Cloud SQL or Managed Instance)
```

## 2. Infrastructure Requirements

- **Node.js**: v20 or newer
- **MariaDB**: v10.6 or newer
- **Memory**: Minimum 1GB RAM
- **Storage**: SSD recommended for application and uploads

## 3. Deployment Procedure

### Step 1: Prepare the Environment

Create a dedicated system user:
```bash
sudo useradd -m -s /bin/bash cafefinder
```

### Step 2: Configure Environment Variables

Create a `/home/cafefinder/app/.env` file with production secrets. Use `.env.example` as a template.

### Step 3: Build the Application

```bash
# Install production dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build frontend and server bundle
npm run build
```

### Step 4: Apply Database Migrations

```bash
# Apply migrations to production database
npx prisma migrate deploy
```

### Step 5: Start the Service

It is recommended to use `systemd` to manage the process. See `scripts/cafefinder.service` for a template.

```bash
sudo systemctl enable cafefinder
sudo systemctl start cafefinder
```

## 4. Reverse Proxy Configuration (Nginx Example)

```nginx
server {
    listen 80;
    server_name cafefinder.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static uploads directly for better performance
    location /uploads/ {
        alias /home/cafefinder/app/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

## 5. Maintenance and Backups

Configure cron jobs for backups and cleanup:

```bash
# Edit crontab for cafefinder user
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /home/cafefinder/app && npm run backup:all >> /home/cafefinder/app/logs/backup.log 2>&1

# Daily cleanup at 3 AM
0 3 * * * cd /home/cafefinder/app && npm run system:cleanup >> /home/cafefinder/app/logs/cleanup.log 2>&1
```

## 6. Monitoring

Use the following endpoints for monitoring:
- `/api/health`: Comprehensive system health (Internal use)
- `/api/ready`: Readiness probe for load balancers
- `/api/live`: Liveness probe for process managers
