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
- **Embedded PostgreSQL Fallback**: Automatic detection of database connectivity issues with seamless failover to an embedded PGlite service, ensuring zero-downtime development and testing.
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
- **Database**: PostgreSQL `14+` OR simply use the built-in **Embedded PostgreSQL (PGlite)** for zero-config local setup.
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

Open `.env` and configure the following required variables. **Note**: If you want to use the zero-config embedded database, you can leave the `PRISMA_DATABASE_URL` empty or point it to a local file.

```env
# Database Connection
# Leave empty or use localhost:5432 for standard PG.
# The app will automatically failover to PGlite if unreachable.
PRISMA_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cafefinder?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development

# Google Maps Platform (Required for Map UI and Location Picker)
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

---

### Step 3: Database Initialization

Initialize the database schema and seed initial demonstration data. If using PGlite, ensure no other process is holding the port specified in `LOCAL_PG_PORT` (default 5442).

```bash
# 1. Sync database schema (Safe for initial setup)
npm run db:push

# 2. Seed demonstration cafes, users, reviews, and amenities
npm run db:seed
```

---

### Step 4: Start Development
```bash
npm run dev
```
The application will boot at **`http://localhost:3000`**. The development server handles:
1.  **Backend API**: Express server running on port 3000.
2.  **Frontend**: Vite middleware serving the React SPA.
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
