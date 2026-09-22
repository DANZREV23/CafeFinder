# CafeFinder Production Deployment & Rollback Checklist

Use this operational checklist before, during, and after every production release.

---

## 1. Pre-Deployment Verification Checklist

Before initiating any production deployment, ensure the following checks are complete:

- [ ] **Release Scope Defined**: Changes are merged into the release branch and reviewed.
- [ ] **Semantic Version Updated**: `package.json` version has been bumped appropriately.
- [ ] **Tests & Linting Green**:
  ```bash
  npm run lint
  npm run test
  ```
- [ ] **Preflight Environment Check**:
  ```bash
  npm run deploy:check
  ```
  - [ ] Node.js runtime is v20+
  - [ ] PostgreSQL connection and latency verified
  - [ ] Required environment variables present in `.env`
  - [ ] `uploads/`, `backups/`, and `logs/` exist and are writable
- [ ] **Database Migration Safety Check**:
  ```bash
  npm run migration:check
  ```
  - [ ] All migrations are additive (Expand and Contract strategy)
  - [ ] No unreviewed `DROP TABLE` or `DROP COLUMN` statements
  - [ ] Nullability constraints include sensible defaults
- [ ] **Production Database Backup**:
  ```bash
  npm run backup:all
  ```
  - [ ] Verify backup SQL file exists in `backups/` and is non-empty.
- [ ] **Operator Access Verified**:
  - [ ] SSH access to target host is functional
  - [ ] Sudo access to `systemctl restart cafefinder` confirmed
  - [ ] Admin credentials available for web panel inspection

---

## 2. Deployment Execution Checklist

Execute the deployment pipeline:

- [ ] **Trigger Automated Deployment**:
  ```bash
  npm run deploy
  ```
- [ ] **Monitor Deployment Steps**:
  - [ ] Step 1: Deployment lock acquired (`.deployment.lock`)
  - [ ] Step 2: Preflight validation passed
  - [ ] Step 3: Pre-deploy database snapshot recorded
  - [ ] Step 4: Application bundle compiled (`dist/server.cjs`)
  - [ ] Step 5: `release.json` generated with accurate commit SHA
  - [ ] Step 6: Prisma migrations deployed successfully (`prisma migrate deploy`)
  - [ ] Step 7: Application service restarted via systemd
  - [ ] Step 8: Health checks and smoke tests executed
  - [ ] Step 9: Obsolete releases cleaned up (retaining latest 3)
  - [ ] Step 10: Deployment lock released

---

## 3. Post-Deployment Verification Checklist

After the deployment script reports success:

- [ ] **Run Independent Verification**:
  ```bash
  npm run deploy:verify
  ```
- [ ] **Probe Health Endpoints**:
  - [ ] `GET /api/live` returns HTTP 200 `{ "status": "alive" }`
  - [ ] `GET /api/ready` returns HTTP 200 `{ "status": "ready" }`
  - [ ] `GET /api/health` returns HTTP 200 with database status `connected`
- [ ] **Verify Core Public Views**:
  - [ ] Homepage renders correctly without JavaScript console errors
  - [ ] Explore page lists active cafes
  - [ ] Search query returns cafe results
  - [ ] Cafe details page loads amenities and photos
- [ ] **Verify Authenticated Flows**:
  - [ ] User login and session persistence
  - [ ] Admin panel access: `/admin`
  - [ ] Admin Deployments page displays new release version: `/admin/system/deployments`
- [ ] **Verify Asynchronous Subsystems**:
  - [ ] Email job queue operational (if `EMAIL_ENABLED=true`)
  - [ ] Uploaded image serving (/uploads/...) resolves properly
- [ ] **Monitor System Metrics (5-15 minutes)**:
  - [ ] Error logs in `/home/cafefinder/app/logs/` or `journalctl -u cafefinder -f`
  - [ ] CPU and memory consumption within normal thresholds
  - [ ] Database connection pool latency normal

---

## 4. Rollback Readiness & Execution Checklist

If severe regressions, persistent 500 errors, or data corruption are detected:

- [ ] **Check Database Compatibility**:
  - [ ] Confirm if recent migrations introduced breaking schema changes.
  - [ ] If migrations were non-breaking/additive: safe to roll back code immediately.
  - [ ] If migrations broke schema: prepare to restore pre-deploy database snapshot.
- [ ] **Execute Automated Rollback**:
  ```bash
  npm run rollback
  ```
- [ ] **Verify Post-Rollback State**:
  - [ ] `GET /api/health` returns HTTP 200
  - [ ] Public cafe listing operational
  - [ ] Check `/admin/system/deployments` for `ROLLED_BACK` audit status
- [ ] **Notify Engineering & File Incident**:
  - [ ] Archive failed deployment logs for post-mortem analysis.
