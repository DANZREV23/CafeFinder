# Maintenance Runbook

## Routine Tasks

### Daily Tasks
- Verify backup success via `/admin/system`.
- Check for high error rates in logs.
- Monitor disk space.

### Weekly Tasks
- Review slow query logs.
- Audit "Pending" cafe submissions and claims.
- Check for failed email jobs and investigate causes.

### Monthly Tasks
- Run `npm run system:cleanup` (if not automated).
- Review data integrity report (`/admin/system/data-integrity`).
- Run `npm audit` and update critical security patches.

## Maintenance Procedures

### Enabling Maintenance Mode
1. Login as ADMIN.
2. Go to System Settings.
3. Toggle "Maintenance Mode" to ON.
4. Verify all routes (except health checks) return the maintenance page.

### Database Schema Changes
1. Run `npm run migration:check` to ensure safety.
2. Backup the production database.
3. Deploy the new schema via `npx prisma migrate deploy`.
4. Verify application health.

### Log Rotation
System logs are rotated daily by `logrotate` (standard Linux config) or limited in-memory for the Admin dashboard.
Application logs are stored in the `/logs` directory.
