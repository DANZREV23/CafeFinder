# CafeFinder Davao

CafeFinder Davao is a high-performance, full-stack specialty coffee discovery and cafe management platform designed for Davao City. Visitors can explore local coffee shops with high-precision filtering, interactive Google Maps visualizer, community ratings, and curated editorial guides. Authenticated users can bookmark favorites, submit reviews, and suggest new cafes. Verified cafe owners access a dedicated operations dashboard with analytics, menu controls, and change request workflows, while system administrators have comprehensive moderation, data integrity self-healing tools, and an automated deployment pipeline.

---

## 🚀 Recent Feature Additions & Platform Enhancements

### 1. Advanced Content Management & Editorial Workflow (Stage 35)
- **Granular Editorial Controls**: Support for multi-stage content lifecycles including `DRAFT`, `PENDING_REVIEW`, `SCHEDULED`, `PUBLISHED`, and `ARCHIVED` statuses for blog posts and curated lists.
- **Automated Scheduled Publishing**: Integrated background job runner that automatically transitions content from `SCHEDULED` to `PUBLISHED` based on precise timestamps.
- **Full Revision History & Snapshots**: Automated tracking of all content changes. Administrators can view historical versions, compare changes, and instantly restore previous versions (Snapshots) with a single click.
- **Admin Editorial Preview**: Secure preview mode allowing administrators to view non-published content directly via public slugs before they go live.
- **Metadata-Driven SEO & Accessibility**: Direct editing of `Alt Text` and `Captions` for all visual assets within the Admin Media Library and Owner Photo galleries to ensure AA/AAA accessibility compliance and optimized SEO indexing.

### 2. Media Library & Visual Asset Governance
- **Centralized Media Dashboard (`/admin/media`)**: Comprehensive management interface for all application assets with support for MIME-type filtering, usage tracking, and search by metadata.
- **Usage & Dependency Tracking**: Real-time tracking of media asset usage across cafes, blog posts, and curated lists to prevent data corruption and identify orphaned assets.
- **Enhanced Cafe Gallery Management**: Overhauled owner UI with high-fidelity grid layouts, cover photo selection, and integrated accessibility metadata editing.

### 3. Automated Deployment & Release Management (`/admin/system/deployments`)
- **Automated Pipeline Runner**: Full deployment automation via `npm run deploy` and `npm run rollback` with sequential stage transitions: `PENDING` → `BUILDING` → `MIGRATING` → `RESTARTING` → `VERIFYING` → `SUCCEEDED`.
- **Preflight Verification Engine (`npm run deploy:check`)**: Automated validation of Node.js engine compatibility, production environment variables, database connectivity, filesystem permissions, and migration safety.
- **Migration Safety Checks**: AST and regex scanning of Prisma migrations to detect destructive operations before application to production.

### 4. Data Integrity & Reliability Suite
- **Local PGlite Fallback**: Development can use a persistent PGlite database when an external PostgreSQL connection is unavailable. This is a separate local data store, not replication, failover protection, or a backup of the configured PostgreSQL database. Confirm the active connection before writes or migrations.
- **Rating Recalculation Engine**: One-click administrative utility to audit and recalculate aggregate ratings and review counts directly from verified database reviews.
- **Validation Resilience**: Enhanced API error handling with granular Zod validation message reporting, providing users with precise feedback on form submission errors.

### 5. Dual-Layer Persistent Authentication & RBAC
- **Hybrid Session Persistence**: Dual authentication architecture supporting both HTTP-only secure cookies and `Authorization: Bearer <token>` / `x-auth-token` headers. This prevents third-party cookie blocking from dropping active sessions inside sandboxed iframe containers.
- **Granular RBAC (`RoleRoute`)**: Route guards enforcing permissions across three distinct user tiers: `USER`, `OWNER`, and `ADMIN`.
- **Seamless Login Redirection**: Preserves intended destination routes during login, returning users automatically to their requested page upon successful authentication.

### 6. Cafe Owner Workspace & Change Request Workflow
- **Ownership Verification & Claims (`/admin/claims`)**: Legal verification workflow enabling legitimate cafe owners to claim existing directory listings with document review.
- **Cafe Change Request System**: Dedicated owner interface to propose updates to business information, geolocation coordinates, hours, amenities, and photo galleries without corrupting live public directory data until reviewed and approved by administrators.
- **Cafe Performance Analytics**: Visual graphs tracking page views, directions clicks, website taps, phone inquiries, and favorite additions.

### 7. System Telemetry & Operational Health (`/admin/system`)
- **Real-Time Telemetry Dashboard**: Live monitoring of server uptime, Node.js version, memory usage, Cloud SQL latency, storage disk consumption, and recent HTTP route latency and error rates.
- **Maintenance Mode Switch**: Immediate system-wide maintenance gate with bypass options for administrators.
- **Database & Upload Backups**: Automated snapshot scripts (`npm run backup:all`) archiving database dumps and upload directories with optional compression and retention policies.

### 8. Progressive Web App (PWA) & Offline Resilience
- **Offline Fallback State**: Seamless client handling with responsive private offline notifications when internet connectivity drops.
- **Web App Manifest**: Installable PWA support with desktop and mobile shortcuts, caching strategies, and asset preloading.

## Application Feature Guide

CafeFinder has distinct public, signed-in user, cafe-owner, and administrator workflows. Public APIs expose published records; private owner and admin operations use server-side session and role checks.

### Public discovery

- **Home (`/`)**: Search and discovery entry point with recommendations, trending cafes, curated lists, editorial content, and currently relevant events or specials.
- **Explore (`/explore`)**: Browse published cafes with server-side search, pagination, filters, sorting, and map/list discovery. Cafe visibility is based on publication status, not on being verified, featured, or trending.
- **Cafe profiles (`/cafes/:slug`)**: View address, contact links, hours, amenities, photos, map, menus, ratings, approved reviews, related cafes, recommendations, upcoming events, active specials, and relevant announcements.
- **Events (`/events`), specials (`/specials`), and announcements (`/announcements`)**: Browse published, time-relevant cafe content. Details use cafe-scoped URLs such as `/events/:cafeSlug/:slug` and `/specials/:cafeSlug/:slug`.
- **Editorial**: Read published posts at `/blog` and curated cafe collections at `/lists`.
- **PWA**: Installable web app with an offline fallback. Private drafts and admin data are not public discovery content.

### Signed-in users

Registered users can manage a profile, favorite cafes, write and edit their own reviews, submit cafes for review, track submission status, view notifications, and use recommendation preferences. Reviews pass through moderation before appearing publicly or contributing to cafe rating aggregates.

### Cafe owners

The protected `/owner` workspace provides cafe management and performance summaries. Owners can manage cafe details, hours, amenities, photos, menus, review responses where enabled, and analytics; submit ownership claims and cafe change requests; and manage events, specials, and announcements. Time-sensitive content starts as a draft, must be submitted for review, and becomes public only after approval. Owners can manage content only for cafes they own.

### Administrators

The protected `/admin` workspace includes cafe submissions, reviews and reports, owner claims, change requests, user status, cafe directory controls, activity logs, and content management for blog posts, curated lists, testimonials, redirects, media, and time-sensitive content. System tools cover health, deployments, backups, scheduled jobs, security, alerts, recommendations, and data-integrity diagnostics. Administrative changes use the existing audit log.

### Platform capabilities

- Session authentication and role-based authorization for `USER`, `OWNER`, and `ADMIN`.
- Validated cafe, review, menu, media, and content workflows; image processing and upload checks.
- Aggregate cafe analytics and explainable discovery recommendations.
- Notifications and queued email for existing transactional workflows; no automatic bulk promotional email.
- Localization hooks, accessible controls, responsive layouts, canonical metadata, sitemap/robots endpoints, and PWA support.
- Operational logging, health endpoints, maintenance mode, rate limits, scheduled cleanup, backups, migration checks, deployment verification, and rollback tooling.

### Time-sensitive content (Stage 38)

Events, specials, and announcements belong to a cafe and use cafe-scoped slugs. Public queries enforce publication status and active/upcoming time windows in the database. Date values are stored as UTC instants with an IANA timezone retained for display. Owner edits to published content return it to review; admins can approve, reject, cancel, archive, restore eligible items, and feature events or specials. Expiration hides content in public queries independently of the scheduled expiration job; historical records are retained.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, `motion/react`, Recharts, `lucide-react` |
| **Backend** | Node.js (v20+ / v22+), Express 4, TypeScript, Prisma ORM 6, PostgreSQL |
| **Embedded DB** | PGlite (PostgreSQL implementation for Node.js) |
| **Mapping & Location** | Google Maps Platform (`@react-google-maps/api`, `@vis.gl/react-google-maps`) |
| **Operations & Storage** | Nodemailer, Multer, Sharp (Image processing), Zod (Validation), UUID |

---

## 📦 Installation & Setup Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Database**: PostgreSQL `14+` is recommended. For local development, the app can start a persistent PGlite database if neither `PRISMA_DATABASE_URL` nor `DATABASE_URL` is configured or the configured database is unavailable.
- **Package Manager**: `npm` (v10+)
- **Optional map key**: Google Maps Platform key for interactive maps.
- **Backup tools**: PostgreSQL `pg_dump` and `psql` client tools are recommended for complete logical backups and restore verification.

### Step 1: Obtain the source and install dependencies
```bash
# Clone repository
git clone <repository-url>
cd cafefinder

# Install all npm dependencies
npm install
```

---
### Step 2: Create or preserve environment configuration

For a new checkout with no `.env`, copy the template. Do not overwrite an existing `.env`; it identifies the database and contains secrets.

PowerShell:
cp .env.example .env
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

Open `.env` and configure the following required variables. **Note**: If you want to use the zero-config embedded database, you can leave the `PRISMA_DATABASE_URL` empty or point it to a local file.
macOS/Linux:
```bash
test -e .env || cp .env.example .env
```

Review `.env` before starting. `PRISMA_DATABASE_URL` takes precedence over `DATABASE_URL`; confirm the host, port, and database name point to the intended data. The template contains placeholders that must be replaced for PostgreSQL. Never commit `.env` or expose credentials in logs or support requests.
```env
# Database Connection
# Keep the URLs consistent if both are set.
PRISMA_DATABASE_URL="postgresql://<user>:<password>@127.0.0.1:5432/<database>?schema=public"
DATABASE_URL="postgresql://<user>:<password>@127.0.0.1:5432/<database>?schema=public"
NODE_ENV=development

SESSION_SECRET="use-a-long-random-secret"
VITE_GOOGLE_MAPS_API_KEY="optional-map-key"
GOOGLE_MAPS_API_KEY="optional-map-key"

---
If neither database URL is configured, CafeFinder uses PGlite at `prisma/pgdata_v9` on port `5442`. This is a separate persistent database, not replication or a backup of PostgreSQL. A connection failure can cause the app to use local PGlite data; verify startup logs and the active database target before important writes or migrations.
### Step 3: Database Initialization
### Step 3: Establish the database schema
Initialize the database schema and seed initial demonstration data. If using PGlite, ensure no other process is holding the port specified in `LOCAL_PG_PORT` (default 5442).
For a **new, empty development database**, apply the repository migrations:
```bash
# 1. Sync database schema (Safe for initial setup)
npm run db:migrate
```
# 2. Seed demonstration cafes, users, reviews, and amenities
For an existing database, read [Existing Data Safety](#existing-data-safety) first, confirm the target, and take verified backups before applying migrations. Do not use `db:push` as a substitute for migrations on a migration-managed database. Production deployments should use `npm run deploy`, which performs preflight, backup, migration-safety checks, migration, and health verification.

> **Destructive command:** `npm run db:seed` deletes existing users, cafes, reviews, and related records before inserting demo data. Use it only on a disposable database that contains nothing you need. Never run it against an existing, shared, staging-with-real-data, or production database.

### Step 4: Start development

```bash
npm run dev

---
Open `http://localhost:<PORT>` (default `3000`; `.env` may set a different port). Express serves the API and Vite serves the React app. If Prisma generation reports `EPERM` for `query_engine-windows.dll.node` on Windows, stop the existing CafeFinder server gracefully with `Ctrl+C` and retry. Do not kill unrelated Node processes.

### Step 5: Verify the installation

```bash
npm run lint
npm run build
```

With the app running, check `/api/ready`, `/explore`, `/events`, and `/specials`. `npm run test:smoke` uses `APP_URL` or `http://localhost:<PORT>`. Maps require the optional Google Maps key. Do not seed the database simply to populate an empty screen if the current database contains data you want to keep.
3.  **Database**: Embedded PostgreSQL (PGlite) server running on port 5442 (if external PG is not configured).

---

## 🔑 Default Demonstration Accounts

After running `npm run db:seed`, use these credentials to explore the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@cafefinder.local` | `password123` |
| **Cafe Owner** | `owner@cafefinder.local` | `password123` |
| **Regular User** | `user@cafefinder.local` | `password123` |

---

## 🚀 Production Deployment & Verification

To compile, bundle, and run in production mode:

```bash
# 1. Full Production Build (Compiles Prisma, Vite client, and bundles Node.js backend)
npm run build

# 2. Run type checking and deployment preflight
npm run test

# 3. Apply production deployment workflow (backup, migration checks, migrations, restart, health checks)
npm run deploy

# Or, when managing build/migration/service steps yourself, launch the built server
npm run start
```

With the server running, execute HTTP smoke tests separately using `npm run test:smoke` (set `APP_URL` if it is not on the default local URL).

## 🛡️ Existing Data Safety

Use this checklist before upgrading an existing installation, changing database settings, applying migrations, restoring a backup, or troubleshooting missing cafes. The most common cause of an apparently empty app is connecting to a different database than the one that contains the expected data.

1. **Confirm the active data source.** Review `PRISMA_DATABASE_URL` first, then `DATABASE_URL`; the former takes precedence. Confirm host, port, and database name locally without posting credentials. Check startup logs for the connection target. If neither URL is configured, the app uses persistent PGlite data under `prisma/pgdata_v9` on port `5442`. If a configured database is unreachable, the app may fall back to this separate local database; it does not copy or synchronize records between them.
2. **Preserve configuration and persistent files.** Do not overwrite `.env`. Do not delete or replace `prisma/pgdata_v9`, `uploads/`, `backups/`, or any PostgreSQL data directory to fix an empty page or startup issue. If moving an installation, preserve the active database and the complete upload directory, not just the source code or `dist/` build.
3. **Check migration state and review SQL.** Before applying changes, run `npx prisma migrate status` and `npm run migration:check`; inspect pending migration SQL and confirm it targets the intended database. For production, use the deployment workflow rather than `db:push`. Do not proceed if the target database or migration effects are unclear.
4. **Create and verify backups before migration or restore.** Confirm `BACKUP_DIR` is writable and has enough free space. Install PostgreSQL client tools and verify `pg_dump --version`. Then run `npm run backup:all` and confirm fresh, non-empty database and uploads archives were created. Copy backups off the application host before proceeding.

	**Important backup limitations:** Without `pg_dump`, the database backup command falls back to a Prisma JSON export. That fallback does not currently include every model, including the Stage 38 time-sensitive content models, so it is not a complete upgrade backup. Do not treat it as sufficient; install/use `pg_dump` and verify a full SQL dump before upgrading. The uploads backup script archives the project-root `uploads/` directory; if your deployment stores uploads elsewhere (for example, via `UPLOAD_DIR`), back up and verify that actual directory separately.

5. **Verify restore in an isolated database.** Use the restore-test script with a specific backup file, for example `npm run db:restore-test -- backups/cafefinder-db-<timestamp>.sql.gz`. It creates and drops a temporary database; ensure the configured DB account has permission to do that. Never test restoration against the live database. Keep original backups unchanged.
6. **Apply migrations, not demo setup.** In local development, run `npm run db:migrate` only after confirming the target and backups. In a configured production deployment, use `npm run deploy` and review each preflight/backup/migration/health-check result. **Never run `npm run db:seed` on an existing database:** the seed script deletes users, cafes, reviews, and related records before inserting demo data. `npm run db:push` bypasses migration history and is for disposable databases only, not a normal upgrade procedure.
7. **Verify data after changes.** Check `/api/ready`, sign-in, cafes, reviews, menus, and uploaded images. Confirm the app still points to the intended database and that backup archives are retained until post-upgrade verification and a new backup succeed.

For a PGlite file copy, first stop CafeFinder gracefully (`Ctrl+C` in its terminal, or the configured service manager), then copy the entire `prisma/pgdata_v9` directory. Never copy a live PostgreSQL server's data directory as a substitute for `pg_dump`. When stopping or restarting on Windows, stop only CafeFinder processes; do not terminate unrelated Node processes.

---

## 📜 Available NPM Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Generates Prisma Client and starts Express/Vite development server on `PORT` (default 3000); stop an older CafeFinder process first if Prisma reports a locked query-engine DLL |
| `npm run build` | Builds Prisma client, Vite assets, bundles `dist/server.cjs` via `esbuild`, and generates release manifest |
| `npm run start` | Boots the bundled CommonJS production server from `dist/server.cjs` |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run deploy:check` | Runs preflight checks (Node version, env vars, database latency, directory permissions) |
| `npm run deploy` | Executes the automated deployment pipeline and health verification |
| `npm run rollback` | Executes automated rollback to the previous stable release version |
| `npm run deploy:verify` | Performs end-to-end smoke verification against the active running release |
| `npm run migration:check`| Scans Prisma SQL migrations for destructive DDL commands |
| `npm run db:migrate` | Applies Prisma migrations in development mode (`prisma migrate dev`) |
| `npm run db:push` | Pushes schema directly without migration history; disposable local databases only |
| `npm run db:generate`| Generates the latest Prisma Client TypeScript definitions |
| `npm run db:seed` | **Destructive:** deletes existing application records, then inserts demo data; disposable databases only |
| `npm run backup:all` | Runs database and project-root `uploads/` backups; use `pg_dump` for a complete PostgreSQL backup and verify both archives |
| `npm run backup:db` | Creates a standalone PostgreSQL database dump |
| `npm run backup:uploads`| Creates a standalone compressed archive of uploaded media |
| `npm run system:cleanup`| Manually runs retention cleanup for expired sessions, stale logs, and notifications |
| `npm run scrape:cafes` | Automated scraper to populate the database with Davao City cafe data |
| `npm run test` | Runs TypeScript checking and deployment preflight |
| `npm run test:smoke` | Runs HTTP smoke tests against the running application at `APP_URL` or `http://localhost:<PORT>` |
| `npm run db:restore-test -- <backup-file>`| Restores a specified SQL backup into a temporary database for verification; requires PostgreSQL client tools and database create/drop permissions |

---

## 📖 Operational Documentation

For in-depth operational procedures, consult the repository architecture guides:
- **[Database Performance & Indexing](./DATABASE_PERFORMANCE.md)**: Index strategies and query optimization.
- **[Observability & Logging](./OBSERVABILITY.md)**: Structured log formatting, request correlation, and metric aggregation.
- **[Maintenance Procedures](./MAINTENANCE.md)**: Maintenance mode toggles, backup restoration, and disaster recovery.
- **[Performance Testing](./PERFORMANCE_TESTING.md)**: Load testing scenarios, benchmark criteria, and profiling.

---
*CafeFinder Davao - Engineered for performance, reliability, and community.*
