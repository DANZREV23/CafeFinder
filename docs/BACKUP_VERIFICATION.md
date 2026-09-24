# Backup Verification & Restore Runbook

## Backup Strategy
- **Database**: Full PostgreSQL dump daily (SQL or JSON format).
- **Uploads**: Tarball of the `/uploads` directory weekly.
- **Retention**: Last 7 days kept locally; last 30 days recommended for external storage.

## Automated Verification
Run `npm run db:restore-test` periodically.
This script:
1. Locates the latest backup.
2. Creates a temporary test database.
3. Restores the backup into the test database.
4. Performs an integrity check (table counts, sample queries).
5. Destroys the test database.
6. Records the result in system logs.

## Manual Restore Procedure
1. Stop the application: `systemctl stop cafefinder`.
2. Locate the backup file (e.g., `cafefinder-db-2023-10-27.sql`).
3. Drop the existing database: `dropdb cafefinder`.
4. Create a fresh database: `createdb cafefinder`.
5. Restore from SQL: `psql cafefinder < backup_file.sql`.
6. Start the application: `systemctl start cafefinder`.
7. Verify health: `/api/ready`.
