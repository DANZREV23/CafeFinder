# CafeFinder Backup and Restore Guide

This guide describes the procedures for backing up and restoring the CafeFinder application data.

## 1. Automated Backups

Backups are handled by the `BackupService` and can be triggered via npm scripts.

### Configuration

The following environment variables control the backup behavior:

```env
BACKUP_ENABLED=true
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=14
BACKUP_COMPRESS=true

UPLOAD_BACKUP_ENABLED=true
UPLOAD_BACKUP_DIR=./backups/uploads
```

### Manual Trigger

You can trigger backups manually using the following commands:

```bash
# Backup both database and uploads
npm run backup:all

# Backup only database
npm run backup:db

# Backup only uploads
npm run backup:uploads
```

## 2. Database Backup Procedure

The database backup uses `pg_dump` to create a consistent snapshot of the schema and data.

### Manual Database Dump

If you need to perform a manual dump outside the application:

```bash
pg_dump -h <DB_HOST> -p <DB_PORT> -U <DB_USER> <DB_NAME> > backup.sql
```

### Verification

The automated process verifies:
1. File existence.
2. File size > 0.
3. Gzip integrity (if compressed).
4. Presence of `CREATE TABLE` statements in the SQL.

## 3. Database Restore Procedure

**CRITICAL: Never restore directly into a production database without first testing in a temporary environment.**

### Step 1: Create a Temporary Database for Testing

```bash
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -c "CREATE DATABASE cafefinder_restore_test;"
```

### Step 2: Decompress the Backup (if needed)

```bash
gunzip -c cafefinder-db-YYYY-MM-DD.sql.gz > restore.sql
```

### Step 3: Restore into the Test Database

```bash
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> cafefinder_restore_test < restore.sql
```

### Step 4: Verify the Restored Data

Check the presence of critical tables:

```bash
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> cafefinder_restore_test -c "\dt"
```

Expected tables include: `users`, `cafes`, `cafe_reviews`, `cafe_favorites`, `menus`, `blog_posts`, etc.

### Step 5: (Optional) Production Restore

If the test restore is successful and you must restore to production:

```bash
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> <DB_NAME> < restore.sql
```

## 4. Uploads Backup and Restore

### Backup

The automated process creates a `tar.gz` archive of the `uploads/` directory.

### Restore

To restore uploads:

```bash
# Decompress into the uploads directory
tar -xzf cafefinder-uploads-YYYY-MM-DD.tar.gz -C /path/to/app/root
```

## 5. Retention Policy

Backups are automatically rotated based on the `BACKUP_RETENTION_DAYS` setting (default: 14 days). Files older than this period are removed during each successful backup run.
