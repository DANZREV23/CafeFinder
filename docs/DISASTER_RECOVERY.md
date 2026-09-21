# CafeFinder Disaster Recovery Plan

This document outlines the procedures to follow in the event of various system failures.

## Scenario 1: Application Server Failure

**Symptom**: Application is unreachable or returning 5xx errors across all routes.

**Action**:
1. Check Cloud Run / Server logs for crash reports.
2. Check if the process is running.
3. Verify `/api/live` and `/api/ready` endpoints.
4. Restart the service.
5. If persistent, check for recent configuration changes or failed deployments.

## Scenario 2: MariaDB Failure

**Symptom**: `/api/ready` returns 503. "Database connection error" in logs.

**Action**:
1. Verify database instance status.
2. Check network connectivity between App and DB.
3. Check database logs for connection limits or resource exhaustion.
4. If the database is corrupted, follow the **Database Restore Procedure** from `BACKUP_AND_RESTORE.md`.

## Scenario 3: Lost Uploads/Media

**Symptom**: Cafe photos or user avatars are returning 404.

**Action**:
1. Check the `uploads/` directory on the server.
2. Verify disk space availability.
3. If files are missing, restore from the latest uploads backup:
   ```bash
   tar -xzf cafefinder-uploads-latest.tar.gz -C /app
   ```

## Scenario 4: Failed Deployment

**Symptom**: New version is broken or has major regressions.

**Action**:
1. Identify the last known-good version (commit hash or tag).
2. Re-trigger the deployment for the stable version.
3. If database migrations were applied, evaluate if a database rollback is required (Caution: data loss may occur).

## Scenario 5: Accidental Data Deletion

**Symptom**: Large number of records (e.g., all reviews for a cafe) are missing.

**Action**:
1. Immediately stop the application to prevent further data loss or corruption.
2. Perform a **Restore Test** into a temporary database using the most recent backup before the deletion.
3. Export the missing data from the restored database and import it into production.
4. Do NOT blindly restore the entire database over production if only a small subset of data was lost.

## Scenario 6: Expired/Invalid Configuration

**Symptom**: Features like Map, Email, or AI are failing with "API Key" or "Unauthorized" errors.

**Action**:
1. Check `.env` file or Secret Manager for valid keys.
2. Verify that keys haven't expired or been revoked in the provider's console (Google Cloud, etc.).
3. Update configuration and restart the application.

## Recovery Verification Checklist

After any recovery action, verify:
- [ ] `/api/health` returns success.
- [ ] Users can log in.
- [ ] Public browsing works (Cafes, Blog).
- [ ] Admin dashboard is accessible.
- [ ] New uploads can be processed.
- [ ] Logs are clean.
