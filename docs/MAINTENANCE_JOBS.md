# Maintenance Jobs Documentation

## Overview
CafeFinder uses a centralized **Job Runner** for all automated maintenance and background tasks. This system provides:
- **Locking**: Prevents concurrent execution of the same job across multiple processes.
- **Audit Logging**: Every execution is recorded in the `maintenance_job_runs` table.
- **Manual Control**: Administrators can trigger jobs on-demand via the Admin Panel.
- **Reliability**: Jobs have timeouts and graceful failure handling.

## Job Registry

| Job Name | Frequency | Purpose | Destructive? |
|----------|-----------|---------|--------------|
| `system-cleanup` | 24h | Cleans expired sessions, notifications, logs, and analytics. | Yes (Retention) |
| `email-retry` | 1m | Retries pending or failed email jobs (max 5 attempts). | No |
| `email-recovery` | 10m | Recovers email jobs stuck in `PROCESSING` state for >1h. | No |
| `data-integrity-scan` | 24h | Scans for missing media and orphaned records. | No |
| `disk-monitoring` | 15m | Checks available disk space and logs alerts. | No |
| `health-verification`| 5m | Verifies database connectivity and system health. | No |
| `backup-database` | Manual | Triggers a full database backup. | No |
| `backup-uploads` | Manual | Triggers an archive of user-uploaded content. | No |
| `recalculate-ratings`| Manual | Forces a refresh of all cafe average ratings. | No |
| `cleanup-missing-media`| Manual | Deletes DB records pointing to missing files. | Yes |
| `cleanup-orphaned-media`| Manual | Deletes files on disk not found in the DB. | Yes |

## Maintenance Architecture
The system uses **Database Locking** to ensure that if the application is running in a clustered environment (e.g., multiple Cloud Run instances), only one instance executes a specific job at a time.

```text
Scheduler (Interval)
   ↓
JobRunner.runJob(name)
   ↓
1. Acquire DB Lock (maintenance_job_locks)
2. Create Run Record (maintenance_job_runs)
3. Execute Task
4. Release Lock
5. Update Run Record (Status, Duration, Counts)
```

## Self-Healing
- **Automatic Email Recovery**: Stuck jobs are reset to `PENDING` to ensure delivery.
- **Stale Lock Recovery**: Locks expire after 30 minutes, allowing the system to recover if a process crashes during a job.
- **Batched Deletion**: Cleanup jobs use small batches (500 records) to avoid long database locks and table bloat.

## Administrative Controls
Accessible via: **Admin Panel > System > Maintenance Jobs**
- Real-time monitoring of job statuses.
- Detailed execution history (Duration, Success/Failure counts).
- Manual "Run Now" triggers for operational tasks.
