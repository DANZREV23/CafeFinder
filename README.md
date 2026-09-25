# CafeFinder Davao

CafeFinder Davao is a high-performance, full-stack specialty coffee discovery and cafe management platform designed for Davao City. Visitors can explore local coffee shops with high-precision filtering, interactive Google Maps visualizer, community ratings, and curated editorial guides. Authenticated users can bookmark favorites, submit reviews, and suggest new cafes. Verified cafe owners access a dedicated operations dashboard with analytics, menu controls, and change request workflows, while system administrators have comprehensive moderation, data integrity self-healing tools, and an automated deployment pipeline.

---

## 🚀 Recent Feature Additions & Platform Enhancements

### 1. Automated Deployment & Release Management (`/admin/system/deployments`)
- **Automated Pipeline Runner**: Full deployment automation via `npm run deploy` and `npm run rollback` with sequential stage transitions: `PENDING` → `BUILDING` → `MIGRATING` → `RESTARTING` → `VERIFYING` → `SUCCEEDED`.
- **Preflight Verification Engine (`npm run deploy:check`)**: Automated validation of Node.js engine compatibility, production environment variables, database connectivity and query latency, filesystem permissions (`uploads/`, `backups/`, `logs/`), migration safety, and source directory integrity before any deployment proceeds.
- **Migration Safety Checks (`npm run migration:check`)**: AST and regex scanning of Prisma migrations to detect destructive operations (e.g., dropping columns/tables, modifying columns without defaults) before application to production.
- **Release Manifest Generation**: Automated tracking of build artifacts (`buildId`, `gitCommit`, `buildTime`, `schemaVersion`, `environment`) exposed via `/api/admin/system/release`.
- **Live Deployment History UI**: Dedicated administration console for viewing real-time deployment status, execution duration, migration outcomes, health verification results, and detailed stage logs.

### 2. Data Integrity & Reliability Suite
- **Embedded PostgreSQL Fallback**: Automatic detection of database connectivity issues with seamless failover to an embedded PGlite service, ensuring the platform remains operational even during upstream database outages or local development without a dedicated PostgreSQL instance.
- **Rating Recalculation Engine**: One-click administrative utility to audit and recalculate aggregate ratings and review counts across all cafes directly from verified database reviews.
- **Orphan Cleanup**: Automated detection and resolution of orphaned reviews and broken relational foreign keys.
- **Media Asset Audit & Cleanup**: Reconciles disk files in `uploads/` against database records, flagging missing physical files and pruning unlinked orphaned media.
- **Cafe Duplicate Detection**: Intelligent multi-parameter duplicate scanner comparing name similarity, geographic proximity, address matching, and contact phone numbers.
- **Iframe-Resilient Confirmation Dialogs**: Replaced native browser `window.confirm` dialogs with tailored in-app modal components, ensuring consistent execution across sandboxed iframe preview environments.

### 3. Dual-Layer Persistent Authentication & Role-Based Access Control
- **Hybrid Session Persistence**: Dual authentication architecture supporting both HTTP-only secure cookies and `Authorization: Bearer <token>` / `x-auth-token` headers. This prevents third-party cookie blocking from dropping active sessions inside sandboxed iframe containers.
- **Client Token Synchronization**: Synchronous session hydration from `localStorage` on page refresh, eliminating unauthenticated flash states during client-side navigation.
- **Granular RBAC (`RoleRoute`)**: Route guards enforcing permissions across three distinct user tiers:
  - **`USER`**: Public discovery, favorites management, cafe submissions, and review writing.
  - **`OWNER`**: Multi-cafe management workspace, operational hours, photo gallery management, and change requests.
  - **`ADMIN`**: Platform-wide moderation, user role administration, data integrity tools, system telemetry, and deployment pipelines.
- **Seamless Login Redirection**: Preserves intended destination routes during login, returning users automatically to their requested page upon successful authentication.

### 4. Cafe Owner Workspace & Change Request Workflow
- **Ownership Verification & Claims (`/admin/claims`)**: Legal verification workflow enabling legitimate cafe owners to claim existing directory listings with document review.
- **Cafe Change Request System (`/owner/cafes/:id/change-requests`)**: Dedicated owner interface to propose updates to business information, geolocation coordinates, hours, amenities, and photo galleries without corrupting live public directory data until reviewed and approved by administrators.
- **Advanced Operating Hours**: Granular schedule manager supporting standard hours, split shifts, overnight closing times, and special holiday hours.
- **Cafe Performance Analytics**: Visual graphs tracking page views, directions clicks, website taps, phone inquiries, and favorite additions.

### 5. System Telemetry & Operational Health (`/admin/system`)
- **Real-Time Telemetry Dashboard**: Live monitoring of server uptime, Node.js version, memory usage (RSS, Heap, ArrayBuffers), Cloud SQL latency, storage disk consumption (Uploads & Backups), and recent HTTP route latency and error rates.
- **Maintenance Mode Switch**: Immediate system-wide maintenance gate with bypass options for administrators, returning standard `503 Service Unavailable` responses with custom messaging to regular users.
- **Automated Background Prune**: Scheduled cleanup jobs for expired sessions, stale notifications, and activity logs older than retention thresholds (`npm run system:cleanup`).
- **Database & Upload Backups**: Automated snapshot scripts (`npm run backup:all`) archiving database dumps and upload directories with optional compression and retention policies.

### 6. Progressive Web App (PWA) & Offline Resilience
- **Offline Fallback State**: Seamless client handling with responsive private offline notifications when internet connectivity drops.
- **Web App Manifest**: Installable PWA support with desktop and mobile shortcuts, caching strategies, and asset preloading.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, `motion/react`, Recharts, `lucide-react` |
| **Backend** | Node.js (v20+ / v22+), Express 4, TypeScript, Prisma ORM 6, PostgreSQL |
| **Mapping & Location** | Google Maps Platform (`@react-google-maps/api`, `@vis.gl/react-google-maps`) |
| **Operations & Storage** | Nodemailer, Multer, Sharp (Image processing), Zod (Validation), UUID |
| **Build & Tooling** | `tsx`, `esbuild`, Vite PWA Plugin, ESLint, TypeScript Compiler |

---

## 📦 Installation & Setup Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Database**: PostgreSQL `14+` or Google Cloud SQL (PostgreSQL)
- **Package Manager**: `npm` (v10+)
- **API Key**: Google Maps Platform API Key (with Places and Maps JavaScript API enabled)

---

### Step 1: Clone and Install Dependencies
```bash
# Clone repository
git clone <repository-url>
cd cafefinder

# Install all npm dependencies
npm install
```

---

### Step 2: Environment Configuration
Create your local environment file from `.env.example`:
```bash
cp .env.example .env
```

Open `.env` and configure the following required variables:

```env
# Database Connection (Local PostgreSQL or Cloud SQL)
PRISMA_DATABASE_URL="postgresql://ai_studio_admin:your_password@localhost:5432/cafefinder?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development
APP_VERSION=1.0.0

# Storage & Backups
BACKUP_ENABLED=true
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=14
BACKUP_COMPRESS=true
UPLOAD_BACKUP_ENABLED=true

# Logging & Monitoring
LOG_LEVEL=info
LOG_RETENTION_DAYS=14

# Google Maps Platform (Required for Map UI and Location Picker)
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Email Configuration (Optional for development; defaults to console logger)
EMAIL_ENABLED=false
EMAIL_PROVIDER=console
EMAIL_FROM_NAME="CafeFinder Davao"
EMAIL_FROM_ADDRESS="noreply@cafefinder.local"
EMAIL_BASE_URL="http://localhost:3000"
```

---

### Step 3: Database Initialization & Seeding

Run the database preparation sequence to apply migrations, generate the Prisma client, and seed initial test accounts and cafes:

```bash
# 1. Apply database migrations
npx prisma migrate dev

# 2. Generate Prisma Client bindings
npm run db:generate

# 3. Seed demonstration cafes, users, reviews, and amenities
npm run db:seed
```

---

### Step 4: Run Preflight Health Checks
Validate your environment, database connectivity, and required writable storage directories before launching:
```bash
npm run deploy:check
```

---

### Step 5: Start Development Server
```bash
npm run dev
```
The application will boot up at **`http://localhost:3000`** (serving both the Express API and Vite React frontend concurrently).

---

## 🔑 Default Demonstration Accounts

After running `npm run db:seed`, the database includes pre-configured accounts with standard credentials:

| Role | Email | Password | Access / Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cafefinder.local` | `password123` | Full Administrative Suite, Deployments, Data Integrity, Telemetry |
| **Cafe Owner** | `owner@cafefinder.local` | `password123` | Cafe Management Hub, Menu, Hours, Change Requests |
| **Regular User** | `user@cafefinder.local` | `password123` | Directory Discovery, Reviews, Submissions, Favorites |

---

## 🚀 Production Deployment & Verification

To compile, bundle, and run in production mode:

```bash
# 1. Full Production Build (Compiles Prisma, Vite client, and bundles Node.js backend)
npm run build

# 2. Run Smoke Tests & Preflight Check
npm run test

# 3. Launch Production Server
npm run start
```

---

## 📜 Available NPM Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Starts development server with hot reload via `tsx` on port 3000 |
| `npm run build` | Builds Prisma client, Vite assets, bundles `dist/server.cjs` via `esbuild`, and generates release manifest |
| `npm run start` | Boots the bundled CommonJS production server from `dist/server.cjs` |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run deploy:check` | Runs preflight checks (Node version, env vars, database latency, directory permissions) |
| `npm run deploy` | Executes the automated deployment pipeline and health verification |
| `npm run rollback` | Executes automated rollback to the previous stable release version |
| `npm run deploy:verify` | Performs end-to-end smoke verification against the active running release |
| `npm run migration:check`| Scans Prisma SQL migrations for destructive DDL commands |
| `npm run db:migrate` | Applies Prisma migrations in development mode (`prisma migrate dev`) |
| `npm run db:generate`| Generates the latest Prisma Client TypeScript definitions |
| `npm run db:seed` | Seeds initial demonstration users, cafes, tags, and reviews |
| `npm run backup:all` | Executes full backup of both PostgreSQL database and `uploads/` directory |
| `npm run backup:db` | Creates a standalone PostgreSQL database dump |
| `npm run backup:uploads`| Creates a standalone compressed archive of uploaded media |
| `npm run system:cleanup`| Manually runs retention cleanup for expired sessions, stale logs, and notifications |
| `npm run scrape:cafes` | Automated scraper to populate the database with Davao City cafe data |
| `npm run test:smoke` | Runs end-to-end smoke tests against the running application |
| `npm run db:restore-test`| Tests the integrity of database backup restoration procedures |

---

## 📖 Operational Documentation

For in-depth operational procedures, consult the repository architecture guides:
- **[Database Performance & Indexing](./DATABASE_PERFORMANCE.md)**: Index strategies and query optimization.
- **[Observability & Logging](./OBSERVABILITY.md)**: Structured log formatting, request correlation, and metric aggregation.
- **[Maintenance Procedures](./MAINTENANCE.md)**: Maintenance mode toggles, backup restoration, and disaster recovery.
- **[Performance Testing](./PERFORMANCE_TESTING.md)**: Load testing scenarios, benchmark criteria, and profiling.

---
*CafeFinder Davao - Engineered for performance, reliability, and community.*
