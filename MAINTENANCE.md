# Maintenance Procedures

## Maintenance Mode

Maintenance mode allows administrators to gracefully gate access to the application during planned downtime.

### How it Works
- When enabled, all non-admin and non-health API requests return a `503 Service Unavailable` with a `MAINTENANCE_MODE` error code.
- Health checks also return `503` to inform load balancers that the instance should not receive traffic.
- Admins can still access the `/api/admin/system` endpoints to manage the state.

### Enabling Maintenance Mode
Post a request to:
`POST /api/admin/system/maintenance`
Body: `{ "enabled": true }`

## Data Retention & Cleanup

The `CleanupService` runs periodic tasks to keep the database and storage lean.

### Tasks
- **Expired Sessions**: Removes sessions where `expiresAt < now()`.
- **Orphaned Uploads**: (To be implemented) Detection of files in `uploads/` not referenced in the database.
- **Old Activity Logs**: Removes logs older than 90 days.
- **Stale Email Jobs**: Removes processed or failed email jobs older than 30 days.

Run manually:
`npm run system:cleanup`

## Backups

Backups are handled by `BackupService`.

### Database
- Automated daily backups to `BACKUP_DIR`.
- Fallback to Prisma-based JSON export if `pg_dump` is unavailable.

### Uploads
- Periodic tarball creation of the `uploads/` directory.

Run manually:
`npm run backup:all`

## Storage Quotas
Monitor `OperationalService` status for `uploadsSize` and `availableDiskSpace`. Alerts should be configured if disk space falls below 20%.
