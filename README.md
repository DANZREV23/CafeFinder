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

## 🧭 Application Feature Guide

CafeFinder is a cafe discovery directory with separate experiences for visitors, registered users, cafe owners, and administrators. Public content is served from the published PostgreSQL records; owner and administrator tools are protected by server-side authentication and role checks.

### Public discovery

- **Home (`/`)**: Browse the main discovery experience, featured/trending cafe content, editorial previews, curated lists, testimonials, and discovery calls to action.
- **Explore (`/explore`)**: Browse all published cafes with server-side pagination. Search by cafe, city, address, description, or amenity; filter by city, price range, and amenities; and sort by rating, newest, name, or popularity. Published cafes appear whether or not they are verified, featured, or trending. Those flags are displayed as descriptive badges, not visibility requirements.
- **Cafe profiles (`/cafes/:slug`)**: View cafe details, address, contact links, hours, amenities, photo galleries, map location, menus, ratings, reviews, favorites, related cafes, recommendations, upcoming events, and current specials.
- **Maps**: Use the interactive map on Explore and cafe pages when a map provider key is configured. Select a map marker to focus the corresponding cafe card.
- **Blog (`/blog`)**: Read published editorial posts and open individual posts at `/blog/:slug`.
- **Curated lists (`/lists`)**: Browse published cafe collections and individual lists at `/lists/:slug`.
- **Events (`/events`)**: Browse published, not-yet-ended cafe events. Open details at `/events/:slug`.
- **Specials (`/specials`)**: Browse published active or upcoming cafe specials. Open details at `/specials/:slug`.
- **PWA/offline support**: Install the app on supported devices and use the offline fallback when connectivity is unavailable.

### Visitor and registered-user actions

Visitors can browse public cafes, maps, blogs, lists, events, specials, menus, and public reviews. A registered user can additionally:

1. Create an account at `/register` or sign in at `/login`.
2. Save and remove cafe favorites at `/favorites`.
3. Open `/dashboard` to view discovery activity, saved cafes, recommendations, and account shortcuts.
4. Edit personal information at `/profile`.
5. Set optional recommendation preferences at `/dashboard/settings`, including city, price range, amenities, coffee types, and vibes.
6. Write one review per cafe, provide overall/category ratings, add review photos, edit the user's own review, and delete it where permitted.
7. Submit a new cafe through `/submit-cafe` and track its status under `/my-submissions`.
8. View and manage in-app notifications.

Reviews are initially pending moderation. Only approved reviews contribute to public review lists and cafe rating aggregates. Review photos use the existing upload and authorization pipeline.

### Cafe owner workspace

Users with the `OWNER` role can access `/owner`. Administrators can also access owner tools when required for support. Owner capabilities include:

- View the owner dashboard and owned cafes.
- Manage cafe business information, hours, amenities, photos, cover photos, and menu content.
- Submit ownership claims for existing directory records.
- Submit cafe change requests for administrator review.
- Review cafe reviews and view aggregate cafe analytics.
- Create time-sensitive event and special drafts through the protected time-sensitive API, submit them for moderation, and view owner-scoped content.

Owners are restricted to their own cafes. They cannot change protected public moderation fields, review aggregates, or another owner's cafe data.

### Administrator workspace

Administrators use the protected `/admin` area to manage the platform:

- **Dashboard**: Review pending cafe submissions and moderation workload.
- **Cafe submissions**: Review, approve, reject, or reopen submitted cafes.
- **Reviews**: Moderate pending reviews, hide/restore reviews, inspect review details, and manage review photos.
- **Owner claims**: Review and decide ownership claims.
- **Change requests**: Approve or reject owner requests to change live cafe data.
- **Cafe directory**: Search cafes, update lifecycle status, assign owners, and manage verified, featured, and trending flags.
- **Users**: Review user accounts and update account status.
- **Content**: Manage blog posts, curated lists, testimonials, redirects, media, and content-quality checks.
- **System**: Monitor health, deployments, security, recommendations, operational alerts, scheduled jobs, backups, cleanup, and data integrity.
- **Activity logs**: Audit administrative and important owner actions.

Administrator routes are protected by both authentication and the `ADMIN` role. Moderation operations verify the current database state and are recorded in the existing activity log system.

## 🧑💻 Detailed User Workflows

### Find a cafe

1. Open `/explore`.
2. Enter a cafe name, city, address, amenity, or descriptive term in the search field.
3. Apply optional city, price, or amenity filters.
4. Select a sort order.
5. Switch between list and map views on supported screen sizes.
6. Select a cafe card to open its profile.

Explore uses server-side queries and pagination. It does not require a cafe to be marked verified, featured, or trending to appear.

### Save a favorite

1. Sign in.
2. Select the heart button on a cafe card or profile.
3. Open `/favorites` to review saved cafes.
4. Select the heart button again to remove a saved cafe.

Favorite identities are not publicly exposed.

### Write or edit a review

1. Sign in and open a published cafe profile.
2. Select **Write a review**.
3. Provide overall, coffee, ambiance, and service ratings.
4. Add an experience-focused comment.
5. Optionally upload up to five supported review images within the displayed file-size limit.
6. Submit the review and wait for moderation.
7. Find your review in the cafe profile and use the edit or delete controls when available.

Do not include private information or personal attacks. Normal negative feedback is allowed; content is moderated based on policy and evidence.

### Submit a cafe

1. Sign in.
2. Open `/submit-cafe`.
3. Complete the cafe information and upload any permitted photos.
4. Submit the form.
5. Track the result at `/my-submissions` and open an item for details.

Submissions remain pending until an administrator reviews them.

### Claim a cafe as an owner

1. Sign in with an owner account or eligible account.
2. Open a cafe profile and select the claim workflow, or use the owner claims area.
3. Provide business and verification information.
4. Submit the claim.
5. Monitor its status from the claims page.

Administrators verify claims before assigning ownership.

### Manage a cafe as an owner

1. Sign in with an authorized owner account.
2. Open `/owner` and select a cafe.
3. Use the cafe workspace tabs for business details, location, hours, amenities, photos, menus, reviews, analytics, and change requests.
4. Save permitted changes or submit a change request when live data requires moderation.

### Create an event or special

The current Stage 38 backend supports protected owner creation and moderation workflows for events and specials. Content is created as a draft, submitted for review, and only becomes public after administrator approval. Dates are stored in UTC with an explicit IANA timezone for display. Ended content is excluded from public queries and is marked expired by the maintenance scheduler.

## 🔐 Account, Privacy, and Security Rules

- Roles are `USER`, `OWNER`, and `ADMIN`.
- Authentication uses the existing session system with secure cookies and supported authorization headers.
- Authorization is enforced on the server; frontend route guards are not security boundaries.
- Public DTOs exclude passwords, session tokens, IP addresses, private moderation information, and private account data.
- Public APIs return only published cafes and approved public content.
- Uploaded files are validated and processed through the existing media pipeline.
- User input is validated with Zod and sanitized before storage or rendering.
- External registration links accept safe HTTP(S) protocols only.
- Rate limiting, security headers, request correlation, logging, maintenance mode, backups, and cleanup jobs are enabled through existing backend infrastructure.

## 🌐 Localization, Accessibility, and SEO

- User-facing localization is provided through the existing i18n provider and locale files.
- Forms use labels, validation feedback, keyboard-accessible controls, semantic headings, and responsive layouts.
- Cafe, blog, list, event, and special pages use existing SEO components and canonical route conventions.
- Public sitemap and robots routes exclude private, administrative, and unpublished content.
- Dates, times, and currency values should be displayed using locale-aware formatting and the relevant cafe/content timezone.

## 🧪 Recommended First-Run Checklist

After installation:

1. Copy `.env.example` to `.env` and configure PostgreSQL or the supported local fallback.
2. Configure the map keys if map features are needed.
3. Run `npm run db:push` for a new local schema or `npm run db:migrate` for migrations.
4. Run `npm run db:seed` if demonstration data is needed.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Start the app with `npm run dev`.
8. Verify `/`, `/explore`, `/cafes/:slug`, `/blog`, `/lists`, `/events`, `/specials`, `/login`, and `/admin` with the appropriate account.
9. Run `npm run test:smoke` while the application is running on the configured port.

If Explore appears empty, verify that cafes have `status = PUBLISHED`, the API is reachable, the frontend is using the expected API origin, and the database connection points to the intended PostgreSQL instance.

For in-depth operational procedures, consult the repository architecture guides:
- **[Database Performance & Indexing](./DATABASE_PERFORMANCE.md)**: Index strategies and query optimization.
- **[Observability & Logging](./OBSERVABILITY.md)**: Structured log formatting, request correlation, and metric aggregation.
- **[Maintenance Procedures](./MAINTENANCE.md)**: Maintenance mode toggles, backup restoration, and disaster recovery.
- **[Performance Testing](./PERFORMANCE_TESTING.md)**: Load testing scenarios, benchmark criteria, and profiling.

---
*CafeFinder Davao - Engineered for performance, reliability, and community.*
