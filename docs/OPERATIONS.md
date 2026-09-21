# CafeFinder Operations Guide

This guide provides an overview of the operational tools and processes for managing CafeFinder in production.

## 1. Monitoring Endpoints

CafeFinder provides several endpoints for monitoring health and readiness:

| Endpoint | Method | Purpose | Audience |
|----------|--------|---------|----------|
| `/api/live` | GET | Liveness probe (process is running) | Orchestrators |
| `/api/ready` | GET | Readiness probe (ready for traffic) | Load Balancers |
| `/api/health` | GET | Detailed health (Internal status) | Admins / Monitoring Tools |
| `/api/admin/system/status` | GET | Comprehensive system diagnostic | Admin Dashboard |

## 2. Logging

CafeFinder uses structured JSON logging in production.

- **Log Location**: `logs/app.log`
- **Log Level**: Configurable via `LOG_LEVEL` (debug, info, warn, error).
- **Log Rotation**: Automatic rotation and cleanup handled by `CleanupService`.

Each request is assigned a unique `X-Request-ID` which is included in all logs associated with that request for easy correlation.

## 3. Background Jobs

Several background tasks maintain the system:

- **Email Processing**: Transactional emails are queued in the `email_jobs` table and processed asynchronously.
- **Backups**: Database and upload backups are triggered via cron jobs.
- **Cleanup**: Periodic removal of expired sessions, old notifications, and logs.

## 4. Administrative Diagnostics

The Admin Dashboard includes a **System Status** page (`/admin/system`) that displays:

- **Application**: Uptime, Memory usage, Node version, Version.
- **Database**: Connection status and query latency.
- **Storage**: Disk usage for uploads and backups, available disk space.
- **Email**: Status of the email queue (pending/failed).
- **Backups**: Timestamp and count of recent backups.

## 5. Security Operations

- **Rate Limiting**: Configured in `server/src/config/security.ts`.
- **Audit Logs**: Administrative actions are recorded in the `activity_logs` table.
- **Authentication Events**: Security-sensitive events (failed logins, suspensions) are logged with high priority.

## 6. CLI Operational Commands

The following commands can be run from the application root:

```bash
# Manual Backup
npm run backup:all

# Manual Cleanup
npm run system:cleanup

# Backup Verification
npm run db:restore-test <path_to_sql_gz>
```
