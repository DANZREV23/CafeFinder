# CafeFinder Davao

CafeFinder Davao is a premium, full-stack cafe discovery and ownership platform for Davao City. Visitors can explore published cafes, search and filter listings with high precision, view interactive maps, save favorites, and read community reviews. Authenticated users can submit cafes and reviews, while approved cafe owners receive a secure, data-rich management workspace.

## Recent Updates (September 2026)

- **Advanced Observability**: Implemented structured JSON logging with request correlation (`requestId`), route normalization for grouped metrics, and slow-request detection (threshold-based warnings).
- **Operational Monitoring**: Added a centralized `MetricsService` tracking request counts, error rates, and average latency. Telemetry is exposed via the Admin System dashboard.
- **Maintenance & Resilience**: 
  - **Maintenance Mode**: System-wide gate allowing admins to perform updates while returning graceful `503 Service Unavailable` responses to users.
  - **Automated Cleanup**: Daily prune jobs for expired sessions, old activity logs (90+ days), and stale notification data.
  - **Connection Resilience**: Automatic database connection retries with exponential backoff for handling transient cloud infrastructure blips.
- **Frontend Performance**: Implemented route-level **code splitting** (Lazy Loading & Suspense) to minimize initial bundle size and maximize Lighthouse scores.
- **Transactional Emails**: Robust, provider-agnostic email system using **Nodemailer** with branded HTML templates and background queuing.
- **PWA & SEO**: Full **Progressive Web App** support and automated **Sitemap/Robots.txt** generation for production-ready discovery.

## Core Features

### 1. Discovery and Public Directory
- **Smart Search**: Real-time, case-insensitive searching by cafe name, description, city, and address.
- **Advanced Filtering**: Filter by price range, amenities, rating, verification status, and trending/featured flags.
- **Map Integration**: Visual discovery powered by Google Maps Platform.
- **AI Recommendations**: Smart suggestions based on cafe attributes and community interests.
- **Content Hub**: Specialty Coffee Blog, Curated Lists, and Community Testimonials.

### 2. User & Account Management
- **Persistent Sessions**: Secure, database-backed HTTP-only cookie sessions.
- **Network-Adaptive Security**: Automatic cookie policy adjustment between local network (Tailscale/LAN) and production HTTPS.
- **Activity Logs**: Tamper-evident audit trails for every sensitive action on the platform.
- **Notifications**: Real-time in-app alerts and transactional email notifications.

### 3. Moderation & Claims
- **Cafe Submissions**: Multi-step submission workflow for users to add new coffee shops.
- **Owner Claims**: Transactional claim process to verify and assign ownership of existing cafes.
- **Multi-Role RBAC**: Granular permissions for `USER`, `OWNER`, and `ADMIN` roles.

### 4. Owner Workspace
- **Data Dashboard**: Statistics on cafe performance, favorites, and review trends.
- **Profile Management**: Control over business hours (including overnight support), amenities, and photos.
- **Change Requests**: Managed workflow for high-risk updates (location, status) requiring admin approval.

### 5. Admin Portal
- **Global Moderation**: Centralized control over submissions, reviews, claims, and change requests.
- **System Telemetry**: Real-time monitoring of application health, database status, and performance metrics.
- **User Administration**: Manage user statuses, roles, and platform access.

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, `motion/react`, Recharts.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- **Operations**: Nodemailer (Email), Sharp (Images), Multer (Uploads), Zod (Validation), UUID (Correlation).
- **Persistence**: PostgreSQL, Redis-ready Session Management, Local Filesystem (Uploads).

## Installation Guide

### Prerequisites
- **Node.js**: v22 or newer.
- **Database**: PostgreSQL 14+.
- **API Keys**: Google Maps Platform API Key.

### A. New Installation
1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   cd cafefinder
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *Update `DATABASE_URL`, `CLIENT_URL`, and `VITE_GOOGLE_MAPS_API_KEY`.*

3. **Database Initialization**:
   ```bash
   # Create tables and apply migrations
   npx prisma migrate dev
   # Generate types and client
   npm run db:generate
   # Seed demo accounts and data
   npm run db:seed
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

### B. Updating Existing Installation
If you are updating from a previous version:
1. **Pull and Sync**:
   ```bash
   git pull
   npm install
   ```
2. **Migrate Database**:
   ```bash
   # Apply new schema changes and indexes
   npx prisma migrate dev
   ```
3. **Regenerate Client**:
   ```bash
   npm run db:generate
   ```
4. **Cleanup State (Optional)**:
   ```bash
   # Prune old logs and expired sessions
   npm run system:cleanup
   ```

## Operational Documentation

Detailed technical guides for maintainers:
- [Observability & Logging](./OBSERVABILITY.md)
- [Database Performance & Indexing](./DATABASE_PERFORMANCE.md)
- [Maintenance Procedures](./MAINTENANCE.md)
- [Performance Testing Guide](./PERFORMANCE_TESTING.md)

## Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Full production build (Prisma + Vite + Server bundle) |
| `npm run start` | Run production bundle from `dist/` |
| `npm run system:cleanup` | Run manual data retention cleanup |
| `npm run backup:all` | Execute database and uploads backup |
| `npm run lint` | Run TypeScript type checking |
| `npm run db:seed` | Reset and reseed development data |

---
*CafeFinder Davao - Built with precision and passion for the coffee community.*
