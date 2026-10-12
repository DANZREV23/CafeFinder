# CafeFinder Davao

CafeFinder Davao is a full-stack specialty coffee discovery, community review, editorial publishing, and cafe operations platform built for Davao City. It connects coffee enthusiasts with local cafes through high-precision filtering, interactive Google Maps visualization, curated guides, and side-by-side comparisons—while equipping verified cafe owners and system administrators with analytics, moderation workflows, media governance, and automated zero-downtime deployment tools.

---

## ✨ Complete Application Features

### 1. Public Discovery, Interactive Mapping & Editorial Content
- **Advanced Cafe Explorer (`/explore`)**: Filter and search cafes by keyword, neighborhood/city, price range, Wi-Fi speed/availability, power outlet access, noise level, seating capacity, pet friendliness, parking availability, "Open Now" real-time status, amenities, and tags. Sort results by rating, review volume, trending status, or proximity.
- **Interactive Map Visualizer (`/map`)**: Full-screen Google Maps interface with custom markers, real-time viewport and attribute filtering, interactive preview cards, geolocation ("Near Me"), and one-click Google Maps directions.
- **Comprehensive Cafe Profiles (`/cafe/:slug`)**: Detailed listings featuring operating hours with live open/closed indicators, verified owner badges, photo galleries with accessibility metadata, menu highlights & pricing, contact/social links, community ratings breakdown, and AI-free algorithmic "Similar Cafes" suggestions.
- **Side-by-Side Cafe Comparison (`/compare`)**: Compare multiple cafes simultaneously across ratings, pricing, workspace suitability (Wi-Fi, power outlets, noise level), operating hours, and amenities.
- **Editorial Blog & Curated Lists (`/blog`, `/lists`)**: Magazine-style articles, brewing guides, and hand-picked cafe collections (e.g., *Davao Digital Nomad Favorites*, *Late-Night Study Spots*, *Hidden Garden Cafes*) with dynamic SEO/OpenGraph tags.
- **Progressive Web App (PWA)**: Installable on desktop and mobile devices with offline connectivity detection, graceful fallback banners, and service worker asset caching.

### 2. Registered Community Member Features (`USER` Role)
- **Personalized Recommendations**: Tailored *"Recommended For You"* cafe feed powered by user preferences, saved favorites, and browsing history.
- **Favorites & Collections (`/favorites`)**: Bookmark favorite cafes for quick access across devices.
- **Community Reviews & Photo Sharing**: Publish multi-photo reviews, star ratings, and helpfulness votes, triggering automatic cafe rating recalculations.
- **Community Cafe Submissions (`/submit-cafe`)**: Submit new local coffee shops to the directory using an interactive map pin picker, operating hours builder, amenity selector, and photo uploader.
- **Business Ownership Claims**: Submit legal verification documents directly from a cafe listing to claim ownership and unlock the Cafe Owner Workspace.
- **Profile & Notification Center (`/profile`)**: Manage user profile, avatar, bio, security credentials, and real-time in-app notifications for review approvals, claim updates, and submission statuses.

### 3. Verified Cafe Owner Workspace (`OWNER` Role — `/owner/*`)
- **Owner Analytics Dashboard**: Track listing performance with interactive Recharts visualizations measuring page views, direction clicks, website visits, phone inquiries, favorites, and review velocity.
- **Multi-Cafe Operations**: Manage single or multiple claimed cafe locations from a unified owner portal.
- **Governed Change Request Workflow**: Propose updates to business descriptions, geolocation coordinates, operating hours, menus, and amenities. Changes are staged for administrator review so live verified directory data stays protected against accidental edits.
- **Gallery & Accessibility Management**: Upload high-resolution cafe photos (automatically resized and converted via Sharp), designate cover photos, and edit `Alt Text` and `Captions` for screen-reader accessibility and SEO.
- **Customer Review Engagement**: Monitor and respond officially to community reviews posted on owned cafe listings.

### 4. System Administration & Editorial Governance (`ADMIN` Role — `/admin/*`)
- **Unified Moderation Queues**: Review, approve, or reject community cafe submissions, owner change requests, ownership claims (`/admin/claims`), user reviews (`/admin/reviews`), and testimonials with audit feedback.
- **Multi-Stage Editorial CMS (`/admin/blog`, `/admin/lists`)**:
  - Full lifecycle statuses: `DRAFT`, `PENDING_REVIEW`, `SCHEDULED`, `PUBLISHED`, and `ARCHIVED`.
  - **Automated Scheduled Publishing**: Background scheduler (`schedulerService`) automatically publishes `SCHEDULED` posts and lists when their target timestamp arrives.
  - **Revision History & Instant Rollback**: Every edit generates an immutable `ContentRevision` snapshot; admins can inspect historical versions and restore any prior snapshot in one click.
  - **Admin Preview Mode**: Preview unpublished or scheduled articles and curated lists using their live layout before publishing.
  - **Slug Redirect Governance**: Automatic and manual 301/302 URL redirect management (`ContentRedirect`) with fast in-memory caching so renamed slugs never break existing links or SEO.
- **Centralized Media Library (`/admin/media`)**: Browse all uploaded images across cafes, blog posts, and curated lists; filter by MIME type; edit SEO `Alt Text`/`Captions`; and inspect live entity usage dependencies to prevent deleting active images.
- **User, Role & Taxonomy Administration (`/admin/users`, `/admin/amenities`, `/admin/tags`)**: Manage user accounts, assign roles (`USER`, `OWNER`, `ADMIN`), enforce account statuses (`ACTIVE`, `SUSPENDED`, `BANNED`), and curate platform amenities and tags.

### 5. Platform Reliability, Data Integrity & DevOps Suite (`/admin/system`)
- **Dual-Layer Persistent Authentication**: Hybrid session architecture combining HTTP-only cookies with `Authorization: Bearer <token>` / `x-auth-token` headers to guarantee uninterrupted login sessions across standard browsers and sandboxed iframes.
- **Dual-Mode Database Engine (Cloud SQL / External PG + Embedded PGlite)**: Connects to production PostgreSQL or Google Cloud SQL sockets when configured, and automatically falls back to a serialized embedded PostgreSQL server (**PGlite** on port `5445`) with non-destructive schema auto-healing for zero-config local development.
- **Data Integrity & Self-Healing Utilities**: One-click rating recalculation engine to audit and resynchronize aggregate ratings and review counts directly from approved review records.
- **Real-Time Telemetry & Maintenance Mode (`/admin/system`)**: Monitor server uptime, memory usage, database latency, disk storage, and HTTP route metrics, or toggle global **Maintenance Mode** (with admin bypass) during maintenance windows.
- **Automated Deployment & Rollback Pipeline (`/admin/system/deployments`)**: Built-in release orchestrator (`npm run deploy`, `npm run rollback`) with preflight checks, automated pre-migration backups, destructive SQL migration scanning, and post-deploy smoke verification.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, `motion/react`, Recharts, `lucide-react` |
| **Backend** | Node.js (`v20.x` / `v22.x` LTS), Express 4, TypeScript, Prisma ORM 6, PostgreSQL |
| **Embedded DB** | `@electric-sql/pglite` (Serialized wire-protocol PostgreSQL server on port `5445` for zero-config local use) |
| **Mapping & Location** | Google Maps Platform (`@react-google-maps/api`, `@vis.gl/react-google-maps`), Mapbox GL |
| **Security & Media** | Helmet, Express Rate Limit, BcryptJS, Multer, Sharp (image optimization), Sanitize-HTML, Zod |

---

## 🆕 Installation Guide for New Users (Fresh Setup)

Follow these steps if you are installing CafeFinder Davao for the first time.

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10+`
- **Database**:
  - **Option A (Zero-Config Local Mode)**: Built-in **Embedded PostgreSQL (PGlite)** — requires no external database installation.
  - **Option B (Production / Dedicated DB)**: PostgreSQL `14+` or Google Cloud SQL.
- **Google Maps API Key** *(Optional for local testing, required for live interactive maps)*: Enable *Maps JavaScript API* and *Places API*.

### Step 1: Clone the Repository & Install Dependencies
```bash
git clone <repository-url>
cd cafefinder
npm install
```

### Step 2: Configure Environment Variables
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```

Edit `.env` according to your setup mode:

```env
# Environment & Server Port
NODE_ENV=development
PORT=3000

# Database Connection
# - For Dedicated PostgreSQL: provide your live connection string below.
# - For Zero-Config Embedded DB (PGlite): leave pointed to localhost:5432 if no PG is running,
#   and the server will automatically boot its embedded PGlite instance on port 5445.
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/cafefinder?schema=public"
PRISMA_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/cafefinder?schema=public"

# Security
SESSION_SECRET="replace-with-a-long-random-secret-string"

# Local Uploads & Backups (use relative paths for local dev or absolute paths in production)
UPLOAD_DIR="./uploads"
BACKUP_DIR="./backups"

# Google Maps Platform
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Step 3: Initialize Database & Seed Demonstration Data

#### If Using Zero-Config Embedded PostgreSQL (PGlite):
Simply start the development server—it automatically initializes the database in `./prisma/pgdata_v10`, applies all schema tables, and seeds the initial 20 Davao cafes, amenities, curated lists, blog posts, and demo accounts in the background:
```bash
npm run dev
```

#### If Using an External PostgreSQL Server:
Push or migrate the schema and run the seed script before starting the server:
```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Create tables in your PostgreSQL database
npm run db:push

# 3. Populate initial demonstration data (ONLY run on a fresh/empty database!)
npm run db:seed

# 4. Start the development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

### Default Demonstration Accounts (Fresh Seed)

| Role | Email | Password | Portal Route |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@cafefinder.local` | `password123` | `/admin` |
| **Cafe Owner** | `owner@cafefinder.local` | `password123` | `/owner` |
| **Regular User** | `user@cafefinder.local` | `password123` | `/profile` |

---

## 🔄 Upgrade & Update Guide for Continuing Users (Zero Data Loss)

If you already have an existing CafeFinder installation with real cafes, user accounts, reviews, blog posts, and uploaded photos, follow this section carefully to update the application **without losing or overwriting any existing data**.

> ⚠️ **CRITICAL DATA SAFETY RULES FOR CONTINUING USERS**
> 1. **DO NOT run `npm run db:seed` on an existing database.** The seed script is designed for fresh installations and clears existing tables before inserting demonstration records.
> 2. **DO NOT run `npx prisma migrate reset`.** This command drops and recreates the database.
> 3. **DO NOT delete your `UPLOAD_DIR` (`./uploads` or `/var/www/CafeFinder/shared/uploads`) or your database data directory (`./prisma/pgdata_v10`).**
> 4. **Always run a backup (`npm run backup:all`) before updating.**

---

### Option A: Automated Safe Upgrade Pipeline (Recommended for Production)

CafeFinder includes a built-in deployment orchestrator (`npm run deploy`) that automatically locks the release, verifies environment configuration, backs up your database and uploads, checks migrations for destructive SQL, applies pending migrations safely, builds the production bundle, and runs health smoke tests:

```bash
# 1. Fetch the latest code from Git (your .env and uploads/ are git-ignored and preserved)
git pull origin main

# 2. Install any new or updated npm packages
npm install

# 3. Run the automated safe deployment pipeline
npm run deploy
```

**What `npm run deploy` does behind the scenes:**
1. Acquires a deployment lock so concurrent updates cannot collide.
2. Runs preflight validation (`npm run deploy:check`) on Node version, `.env`, disk permissions, and DB connectivity.
3. Automatically creates a pre-deployment backup of your database and `uploads/` directory (`predeploy_<id>`).
4. Builds the Prisma client, Vite frontend assets, and bundled backend (`dist/server.cjs`).
5. Scans all Prisma migrations (`npm run migration:check`) to ensure no destructive `DROP TABLE` / `TRUNCATE` statements exist.
6. Applies pending migrations non-destructively via `npx prisma migrate deploy`.
7. Restarts the service (if managed by `systemd`) and executes end-to-end health smoke tests (`npm run deploy:verify`).

If any step fails, your previous data backup remains intact and you can immediately revert to the last stable build:
```bash
npm run rollback
```

---

### Option B: Step-by-Step Manual Update (Development & Custom Environments)

If you are updating a local development environment or a custom server manually, follow these exact steps:

#### Step 1: Back Up Your Current Database and Uploaded Media
Before pulling new code, snapshot your current database and uploaded images:
```bash
npm run backup:all
```
Backups are stored in your configured `BACKUP_DIR` (defaults to `./backups` or `/var/www/CafeFinder/shared/backups`).

#### Step 2: Pull the Latest Application Code
```bash
git pull origin main
```
Compare `.env.example` with your existing `.env` file and add any newly introduced environment variables without changing your existing `DATABASE_URL`, `PRISMA_DATABASE_URL`, `SESSION_SECRET`, or `UPLOAD_DIR`:
```bash
diff -u .env .env.example
```

#### Step 3: Update Dependencies & Regenerate Prisma Client
```bash
npm install
npm run db:generate
```

#### Step 4: Safely Apply Schema Updates (Preserving Existing Data)

- **If you are using an External PostgreSQL / Cloud SQL Database:**
  ```bash
  # 1. Verify migration files contain no destructive operations
  npm run migration:check

  # 2. Apply pending migrations non-destructively (production-safe)
  npx prisma migrate deploy

  # 3. Sync any additive schema columns/indexes without resetting data
  npx prisma db push
  ```
  *(Note: If Prisma warns about a change that could cause data loss, abort and review before proceeding.)*

- **If you are using the Embedded Local Database (PGlite):**
  - Your data is stored on disk in `./prisma/pgdata_v10`.
  - When you start the server (`npm run dev` or `npm run start`), `localDbServer.ts` automatically runs non-destructive `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and `CREATE INDEX IF NOT EXISTS` statements against your existing PGlite data directory.
  - Because `prisma.cafe.count()` will be greater than `0` on your existing database, the startup check in `server/src/index.ts` **automatically skips seeding** and preserves all of your existing records.
  - *Upgrading from an older PGlite directory (`pgdata_v9` or earlier)*: If you previously used `./prisma/pgdata_v9` and want to keep that data, either set `LOCAL_PG_DATA_DIR="./prisma/pgdata_v9"` in your `.env` or copy your existing directory to `./prisma/pgdata_v10` while the server is stopped before starting the updated app.

#### Step 5: Rebuild & Restart the Application

- **For Local Development:**
  ```bash
  npm run dev
  ```
- **For Production:**
  ```bash
  # Compile frontend & server bundle
  npm run build

  # Run preflight & type checks
  npm run test

  # Restart your production process
  npm run start
  # (Or if using PM2 / systemd: pm2 restart cafefinder / sudo systemctl restart cafefinder)

  # Verify live endpoints and database health
  npm run deploy:verify
  ```

---

## 🛠️ Post-Update Maintenance & Data Recovery

- **Recalculate Cafe Ratings**: After importing reviews or upgrading, administrators can visit **`/admin/system`** and click **"Recalculate All Ratings"** to synchronize aggregate cafe ratings and review counts without modifying any review content.
- **Test Backup Integrity**: Verify that your database backups can be cleanly restored in an isolated check:
  ```bash
  npm run db:restore-test
  ```
- **Clean Up Expired Sessions & Old Logs**: Reclaim database space from expired login sessions, read notifications, and old system logs without touching user or cafe data:
  ```bash
  npm run system:cleanup
  ```

---

## 📜 Available NPM Scripts Reference

| Script | Purpose | Safe on Existing Data? |
| :--- | :--- | :--- |
| `npm run dev` | Starts development server on port 3000 (auto-seeds **only** if cafe count is 0) | ✅ Yes |
| `npm run build` | Generates Prisma client, builds Vite SPA, bundles `dist/server.cjs`, and writes release manifest | ✅ Yes |
| `npm run start` | Boots the compiled production server (`dist/server.cjs`) | ✅ Yes |
| `npm run lint` | Runs TypeScript static type validation (`tsc --noEmit`) | ✅ Yes |
| `npm run deploy` | Executes full 9-step automated backup, build, migration, and verification pipeline | ✅ Yes |
| `npm run rollback` | Rolls back the application to the previous verified release | ✅ Yes |
| `npm run deploy:check` | Runs preflight checks (Node version, `.env`, DB connectivity, filesystem permissions) | ✅ Yes |
| `npm run deploy:verify` | Runs post-deployment smoke tests against the active server | ✅ Yes |
| `npm run migration:check` | Scans Prisma SQL migrations for destructive DDL operations | ✅ Yes |
| `npm run backup:all` | Creates a timestamped backup of both PostgreSQL database and `uploads/` media | ✅ Yes |
| `npm run backup:db` | Creates a standalone PostgreSQL database dump | ✅ Yes |
| `npm run backup:uploads` | Creates a compressed archive of uploaded media files | ✅ Yes |
| `npm run db:restore-test` | Verifies backup restoration integrity | ✅ Yes |
| `npm run system:cleanup` | Prunes expired sessions, stale logs, and old read notifications | ✅ Yes |
| `npm run test:smoke` | Executes end-to-end API and frontend smoke tests | ✅ Yes |
| `npm run db:generate` | Generates Prisma Client TypeScript definitions | ✅ Yes |
| `npm run db:push` | Syncs Prisma schema with database | ✅ Yes (additive changes) |
| `npm run db:migrate` | Creates and applies new Prisma migrations in development | ✅ Yes |
| `npm run scrape:cafes` | Scrapes and imports Davao City cafe listings | ⚠️ Modifies cafe data |
| `npm run db:seed` | Resets and seeds initial demonstration data | ❌ **Fresh installs only** (wipes existing tables) |

---

## 📖 Additional Operational Guides

For deeper infrastructure and operational documentation, see:
- **[Database Performance & Indexing](./DATABASE_PERFORMANCE.md)**: Indexing strategy and query optimization.
- **[Observability & Logging](./OBSERVABILITY.md)**: Structured logging, request correlation, and telemetry metrics.
- **[Maintenance Procedures](./MAINTENANCE.md)**: Maintenance mode operations, backup scheduling, and disaster recovery.
- **[Performance Testing](./PERFORMANCE_TESTING.md)**: Load testing scenarios and latency benchmarks.

---
*CafeFinder Davao — Engineered for specialty coffee discovery, community trust, and operational reliability.*
