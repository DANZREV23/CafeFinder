# CafeFinder Admin Control Center

The Admin Control Center is the centralized operational headquarters for CafeFinder administrators. It provides real-time monitoring, system diagnostics, and operational tools to ensure the health and performance of the application.

## Core Dashboards

### 1. Control Center Overview (`/admin/system`)
The primary entry point for administrators. It displays a high-level summary of:
- **Application Status:** Environment, uptime, memory usage, and release information.
- **Database Health:** Connectivity, latency, and migration status.
- **Data Safety:** Backup status, retention count, and integrity verification.
- **Storage Infrastructure:** Disk availability and space consumed by uploads and backups.
- **Operational Alerts:** Live feed of critical system events and warnings.

### 2. Operational Alerts (`/admin/system/alerts`)
A dedicated monitoring interface for system incidents.
- **Alert Levels:** INFO, WARNING, and CRITICAL.
- **Deduplication:** Repeated failures are grouped into a single alert with an occurrence count.
- **Workflow:** Administrators can Acknowledge alerts to indicate they are being investigated and Resolve them once fixed.
- **Sources:** Alerts are automatically generated from background jobs, database connection failures, and application errors.

### 3. Maintenance Jobs (`/admin/system/jobs`)
Centralized management of automated tasks.
- **Registered Jobs:** Database backups, session cleanup, notification pruning, and rating recalculation.
- **Execution History:** Detailed logs of every job run, including start time, duration, and outcome.
- **Manual Trigger:** Approved jobs can be run manually with one-click execution.

### 4. Deployment History (`/admin/system/deployments`)
Audit log of all production releases.
- **Release Metadata:** Build IDs, commit timestamps, and versioning.
- **Pipeline Visibility:** Status of migrations and health checks for each deployment.
- **Rollback Context:** Information needed to assess the safety of rolling back to previous versions.

### 5. Security & Logs (`/admin/system/security`)
Operational security audit tool.
- **Security Checkup:** Status of HTTPS, Secure Cookies, CORS, and Rate Limiting.
- **Environment Audit:** Masked view of sensitive environment variables to verify configuration without exposing secrets.
- **Threat Monitoring:** Detection of failed login spikes or rate limit violations.

### 6. Data Integrity (`/admin/system/integrity`)
Self-healing tools for the database.
- **Integrity Audit:** Scans for orphaned records, inconsistent ratings, and missing media files.
- **Repair Controls:** Safe, deterministic repair operations for common data corruption scenarios.
- **Media Cleanup:** Management of orphaned files on disk vs database records.

## Security Architecture

- **Role-Based Access:** All system tools require the `ADMIN` role.
- **Audit Logging:** Every administrative action (running a job, resolving an alert, triggering a repair) is recorded in the immutable Audit Log.
- **Secret Protection:** Sensitive credentials (passwords, API keys, full connection strings) are NEVER exposed in the UI or sent over the API.
- **Safe Operations:** Destructive actions require explicit confirmation and provide clear warnings about database migration compatibility.
