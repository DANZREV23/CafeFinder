# Monitoring Runbook

## Overview
CafeFinder uses a multi-layered monitoring approach:
1. **HTTP Request Logging**: Express middleware logs all requests with Correlation IDs.
2. **Metrics Service**: In-memory tracking of route performance and system events.
3. **Health Checks**: `/api/live`, `/api/ready`, and `/api/health` endpoints.
4. **Operational Status**: Admin-only `/api/admin/system/status` dashboard.

## Health Check Endpoints
- **Liveness (`/api/live`)**: Returns 200 if the process is running. Used for container orchestration.
- **Readiness (`/api/ready`)**: Returns 200 if the database is reachable. Used for load balancer traffic routing.
- **Health (`/api/health`)**: Returns detailed health info (CPU, Memory, DB status).

## Operational Dashboard
Accessible at `/admin/system` (for ADMIN roles only).
Provides:
- Real-time CPU and Memory usage.
- Database latency and table sizes.
- Disk space availability.
- Background job status (Email queue).
- Backup history.
- Recent system events.

## Critical Alerts & Remediation

### High CPU Usage (> 80%)
- **Symptoms**: Slow API responses, increased latency.
- **Checks**: Run `top` on the server to identify the offending process.
- **Likely Causes**: Expensive searches, image processing, or runaway loops.
- **Remediation**: Scale horizontally if in a cluster, or optimize slow queries identified in the performance logs.

### Database Connection Failure
- **Symptoms**: `/api/ready` returning 503.
- **Checks**: Verify PostgreSQL service status. Check `PRISMA_DATABASE_URL` connectivity.
- **Remediation**: Restart PostgreSQL service. Check for connection leaks in Node.js logs.

### Disk Space Low (< 10% Available)
- **Symptoms**: Backups failing, uploads failing.
- **Checks**: Run `df -h`.
- **Remediation**: Run `npm run system:cleanup` to remove old logs and backups. Consider expanding disk volume.

### Email Queue Growing
- **Symptoms**: Users not receiving welcome or notification emails.
- **Checks**: Check `/admin/system` for pending/failed email counts.
- **Remediation**: Check SMTP credentials. Review `EmailJob` table for error messages.
