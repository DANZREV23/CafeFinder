# CafeFinder Release Management & Rollback Strategy

This document describes versioning, release artifacts, deployment safety locks, rollback workflows, and database backward-compatibility practices for **CafeFinder**.

---

## 1. Release Versioning Strategy

CafeFinder follows strict Semantic Versioning (`MAJOR.MINOR.PATCH`):

- **MAJOR (e.g. 2.0.0)**: Incompatible API breaks, architectural restructuring, or major database schema transformations.
- **MINOR (e.g. 1.1.0)**: Backward-compatible feature additions (new endpoints, additive database columns, new dashboard modules).
- **PATCH (e.g. 1.0.1)**: Backward-compatible bug fixes, security patches, performance optimisations.

The authoritative version is stored in `package.json` and mirrored in the active release manifest.

---

## 2. Release Manifest (`release.json`)

During every production build (`npm run build`), the build pipeline generates a standalone `release.json` manifest:

```json
{
  "version": "1.0.0",
  "buildTime": "2026-09-21T19:25:00.000Z",
  "commit": "a3f891b",
  "nodeVersion": "v20.18.0",
  "environment": "production",
  "schemaVersion": "7b58c70dd8a4",
  "platform": "linux-x64"
}
```

### Safety Rules for Release Metadata
- **Never expose secrets**: Environment variables, database passwords, SMTP credentials, and Git push tokens are strictly omitted from `release.json`.
- **Public API**: Safe release metadata is exposed to authenticated administrators via `GET /api/admin/system/release` and displayed on the Admin Deployments dashboard.

---

## 3. Directory Layout & Symlink Management

For atomic zero-effort rollbacks, production environments use a symlink structure:

```
/home/cafefinder/
├── current -> releases/release_20260921_120000/
│
├── releases/
│   ├── release_20260921_120000/    # Current Active Release
│   ├── release_20260920_180000/    # Previous Working Release (Rollback Target)
│   └── release_20260919_090000/    # Historical Release
│
└── shared/
    ├── .env                        # Single source of truth for production configuration
    ├── uploads/                    # Symlinked into current/uploads
    ├── backups/                    # Persistent pre-deploy and scheduled backups
    └── logs/                       # Rotating application logs
```

### Atomic Symlink Switch
Switching releases or rolling back is performed atomically using an intermediate temporary symlink:

```bash
# Atomic switch in Bash
ln -sfn /home/cafefinder/releases/release_20260920_180000 /home/cafefinder/current_tmp
mv -Tf /home/cafefinder/current_tmp /home/cafefinder/current
```

---

## 4. Deployment Concurrency Prevention (Deployment Lock)

To prevent simultaneous deployments from running concurrently and causing race conditions or corrupted migrations:

- **Lock File**: `.deployment.lock` is created in the application root at the beginning of deployment.
- **Lock Payload**: Contains `{ deploymentId, pid, startedAt, host }`.
- **Stale Lock Recovery**: If a previous deployment process crashed, the lock manager checks if the PID is still alive and verifies the lock age. If older than 15 minutes or if the process has died, the lock is automatically recovered with a warning log.

---

## 5. Release Retention & Automated Cleanup

- **Configurable Retention**: Controlled via `RELEASE_RETENTION_COUNT` in `.env` (default: `3`).
- **Never Delete Active Release**: The cleanup script inspects the real target of the `current` symlink and ensures it is never removed.
- **Never Delete Shared Data**: Uploads, backups, and logs reside outside `releases/` and are protected from cleanup.

---

## 6. Rollback Strategy & Procedure

When an issue is detected in production post-deployment:

```bash
# Execute automated rollback
npm run rollback
```

### Automated Rollback Steps
1. **Acquire Lock**: Prevents other deployment actions while rolling back.
2. **Identify Target**: Selects the immediate prior release directory from `releases/`.
3. **Atomic Symlink Update**: Points `/home/cafefinder/current` to the previous release.
4. **Service Restart**: Dispatches `systemctl restart cafefinder`.
5. **Health Verification**: Validates `/api/live`, `/api/ready`, `/api/health`, and public endpoints.
6. **Audit Recording**: Records `ROLLED_BACK` status in `deployment_records` database table.

---

## 7. Critical Database Rollback Warning & Migration Guidelines

> [!CAUTION]
> **Application code rollback does NOT automatically revert database schema changes!**
> If a recent migration dropped a column, transformed table structures, or deleted rows, switching application code back to an older version may result in instant fatal database query errors.

### The "Expand and Contract" Migration Pattern
To guarantee safe rollback capability, **all database migrations must be forward- and backward-compatible**:

1. **Step 1 (Expand - Release N)**:
   - Add new columns as **nullable** or with safe **default values**.
   - Do NOT drop old columns.
   - Dual-write to both old and new columns if transforming data.
2. **Step 2 (Migrate Data - Release N+1)**:
   - Backfill existing rows with new format in background scripts.
   - Both code versions N and N+1 remain fully operational!
3. **Step 3 (Contract - Release N+2)**:
   - Once Release N+1 has been verified stable in production for several days, drop old unused columns in a separate release.

### Migration Safety Scanner
Run `npm run migration:check` during CI/CD. It flags dangerous SQL statements:
- `DROP TABLE`: Verify no active code depends on table data.
- `DROP COLUMN`: Verify prior code release has completely ceased reading/writing the column.
- `ALTER COLUMN`: Verify type conversion and nullability.
- `TRUNCATE / DELETE`: Must be scrutinized for accidental data loss.

---

## 8. PWA & Client Cache Invalidation Strategy

CafeFinder includes Progressive Web App (PWA) capabilities and Vite asset hashing:

1. **Vite Content Hashing**: All compiled JS/CSS bundles in `dist/assets/` use cryptographic content hashes (e.g. `index-B1a89c.js`). New releases never collide with cached assets.
2. **Nginx Cache Rules**:
   - `dist/assets/`: Cached for 1 year (`immutable`).
   - `index.html` and `sw.js`: Cached with `no-cache, must-revalidate` so browsers immediately detect new release versions.
3. **Service Worker Lifecycle**: The Service Worker listens for `SKIP_WAITING` and automatically triggers a prompt or background reload when a new release manifest is detected.
