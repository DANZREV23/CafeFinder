# CafeFinder Davao

CafeFinder Davao is a production-grade full-stack specialty coffee discovery, community review, editorial magazine, digital loyalty rewards, and cafe operations platform built specifically for Davao City, Philippines. It connects coffee lovers, remote workers, students, and tourists with local coffee shops through high-precision filtering, interactive Google Maps visualization, curated neighborhood guides, and side-by-side cafe comparisons—while providing verified cafe owners and platform administrators with customer loyalty programs, real-time analytics, event scheduling, direct customer inquiries, editorial publishing governance, media management, and automated zero-downtime deployment pipelines.

---

## 🚀 Key Features Overview

### 1. Public Discovery, Interactive Mapping & Time-Sensitive Happenings
- **Advanced Cafe Explorer (`/explore`)**:
  - Filter by keyword, neighborhood/district (*Poblacion*, *Matina*, *Lanang*, *Bajada*, *Toril*, *Buhangin*, etc.), price tier (`₱` to `₱₱₱₱`), Wi-Fi speed & stability, power outlet access, noise levels (*Quiet*, *Moderate*, *Lively*), seating capacity, pet friendliness, parking, outdoor patio, and real-time **"Open Now"** operating status.
  - Sort results by rating, review count, trending popularity, or proximity.
- **Interactive Google Maps Visualizer**:
  - Full-screen map interface with custom coffee bean pins, marker clustering, viewport search as you drag, interactive cafe summary cards, geolocation ("Near Me"), and direct Google Maps turn-by-turn directions.
- **Time-Sensitive Discovery Hub & Events Calendar (`/events`, `/specials`)**:
  - **Upcoming Events**: Discover coffee cupping sessions, brewing masterclasses, barista throwdowns, latte art jams, acoustic live music, and book meetups.
  - **Active Specials & Promos**: Browse seasonal drinks, cascara cold brew promotions, afternoon happy hour espresso discounts, and pastry-coffee combos.
  - **Real-Time Urgency Badges**: Live visual badges (*"Today"*, *"Tomorrow"*, *"In 3 days"*, *"% OFF"*, *"Free Entry"*).
  - **Contextual Inquiries & RSVPs**: Direct in-card inquiry modal (`ContactCafeModal`) routing questions directly to cafe proprietors with event or special offer context automatically attached.
- **Homepage "Happening Now & Coming Soon" Showcase**:
  - Dynamic homepage feed displaying upcoming events and active specials with instant tab toggling.
- **Detailed Cafe Profiles (`/cafes/:slug`)**:
  - Live open/closed indicators with current day operating hours and split shift alerts.
  - Verified owner badges, photo galleries with accessibility `alt` tags, food & drink menus with pricing, **live events & current specials showcase**, official cafe announcements, social links, community review breakdown, and algorithmic "Similar Cafes" recommendations.
- **Interactive Cafe Loyalty Section (`CafeLoyaltySection`)**:
  - Highlights active cafe loyalty programs.
  - **Smart Membership Status Detection**: Automatically displays an **"Active Member"** badge with current points balance, one-click **"Check In for Visit"**, and quick access to **"My Wallet"** if the logged-in customer is already enrolled.
  - Displays a clean **"Join Loyalty Program"** action for new customers to enroll in one click.
  - Displays available rewards at that specific cafe with point costs and direct redemption links.
- **Direct Cafe Inquiries (`ContactCafeModal`)**:
  - Allows customers and visitors to message cafe management directly regarding general questions, reservations, operating hours, private events, or dietary options.
- **Side-by-Side Cafe Comparison (`/compare`)**:
  - Compare up to 4 cafes simultaneously across aggregate ratings, workspace amenities (Wi-Fi, outlets, noise), operating hours, pricing, and amenities.
- **Editorial Magazine & Curated Lists (`/blog`, `/lists`)**:
  - Handcrafted neighborhood guides (e.g., *Davao Digital Nomad Favorites*, *Late-Night Study Spots*, *Hidden Garden Cafes*) and brewing articles with dynamic OpenGraph SEO metadata.
- **Public Rewards Catalog (`/rewards`)**:
  - Discover loyalty perks, free specialty beverages, percentage discounts, and bakery treats available across participating Davao coffee shops.
- **Progressive Web App (PWA)**:
  - Installable on iOS, Android, macOS, and Windows with offline connectivity detection, offline cached assets, and service worker background syncing.

---

### 2. Customer Loyalty & Community Member Experience (`USER` Role)
- **1-Click Quick Demo Sign-in (`/login`)**:
  - Instant demo buttons for testing as Customer (`maria@example.com`), Cafe Owner (`owner@cafefinder.local`), or System Administrator (`revero.b@agentsofvalue.com` / `admin@cafefinder.local`).
- **Customer Loyalty Hub (`/dashboard/loyalty`)**:
  - Join cafe loyalty programs with a single click.
  - Submit visit check-ins to self-report visits and earn loyalty points.
  - Real-time tracking of active points balance and lifetime earned/redeemed points per cafe.
  - Request reward redemptions and receive digital voucher codes with verification hints.
  - Cancel pending redemptions with instant point refunds.
  - View full points activity ledgers (earn, redeem, adjustment).
- **Customer Inquiry Center (`/dashboard/inquiries`)**:
  - View all submitted inquiries to cafes with unread response badges.
  - Interactive two-way message threads with cafe owners and management.
  - Ability to reply or reopen closed inquiry threads.
- **Favorites & Custom Collections (`/favorites`, `/dashboard/collections`)**:
  - Bookmark cafes with one click.
  - Create curated personal collections with custom titles, descriptions, and public shareable links.
- **Multi-Photo Community Reviews**:
  - Post verified ratings, multi-image galleries, and helpfulness upvotes.
  - Rate specific workspace amenities (Wi-Fi speed, noise level, outlet availability).
- **Community Cafe Submissions (`/submit-cafe`)**:
  - Submit newly opened cafes using a pin-drop map picker, operating hours schedule builder, and photo uploader.
- **Ownership Claims (`/cafes/:slug/claim`)**:
  - Cafe proprietors can submit business verification documents (Mayor's Permit, DTI Registration) to claim their listing.

---

### 3. Verified Cafe Owner Portal (`OWNER` Role — `/owner/*`)
- **Owner Analytics Dashboard (`/owner`)**:
  - Track listing impressions, direction requests, phone calls, website clicks, favorites, and review velocity with interactive charts.
- **Multi-Location Management (`/owner/cafes`)**:
  - Manage one or multiple cafe branches from a unified workspace.
- **Governed Change Requests**:
  - Submit proposed updates to hours, menus, geolocation, and amenities. Proposed changes are staged for admin review to safeguard directory integrity.
- **Digital Loyalty Program Manager (`/owner/loyalty`)**:
  - Activate or pause custom loyalty programs per cafe location.
  - Set points awarded per customer visit (e.g., 10 pts per visit) and minimum redemption thresholds.
  - Create and manage reward catalog items with point costs, redemption limits, and terms.
  - **In-Store Voucher Verification**: Search customer redemption codes at POS, review details, and mark vouchers as `REDEEMED` to prevent duplicate redemptions.
  - Approve or decline pending reward requests with custom rejection reasons.
- **Events, Specials & Promos Manager (`/owner/cafes/:id/events`)**:
  - Schedule upcoming cafe happenings (Coffee Cuppings, Latte Art Throwdowns, Brewing Workshops, Live Music, Community Circles).
  - Configure event timing, venue/area, capacity, entry fee or free admission, and instant publishing.
  - Launch active specials & promotions (Seasonal Drinks, Happy Hours, Combos, Percentage Discounts) with custom terms and validity periods.
  - Broadcast official announcements with priority levels (`NORMAL`, `IMPORTANT`, `URGENT`).
  - Draft mode with instant "Publish Now" actions, deletion controls, and automated safe follower notification dispatch.
- **Owner Customer Inquiry Inbox (`/owner/inquiries`)**:
  - Centralized messaging inbox for all inquiries submitted by customers and visitors across your managed cafes.
  - Filter by cafe, category (General, Hours, Menu, Reservation, Event, Special, Wifi, Private Event), and status (`NEW`, `READ`, `IN_PROGRESS`, `RESPONDED`, `CLOSED`).
  - Direct two-way reply interface with customer notification dispatch.
- **Customer Review Engagement**:
  - Post official owner responses to customer reviews.

---

### 4. System Administration & Editorial Governance (`ADMIN` Role — `/admin/*`)
- **Modern Charcoal & Orange Admin Sidebar**:
  - Categorized into `MODERATION`, `DIRECTORY`, `USERS`, `CONTENT`, and `SYSTEM`.
  - Fast keyboard and route navigation with direct route aliases (`/admin/recommendations`, `/admin/alerts`, `/admin/jobs`, `/admin/claims`, `/admin/quality`, `/admin/loyalty`, `/admin/inquiries`).
- **Moderation Queues**:
  - **Cafe Submissions (`/admin/submissions`)**: Review, edit, approve, or reject community listings.
  - **Reviews & Flagged Reports (`/admin/reviews`, `/admin/review-reports`)**: Moderate user reviews, inspect flagged reports, and take disciplinary actions.
  - **Owner Claims (`/admin/claims`)**: Verify legal permits and assign cafe ownership.
  - **Change Requests (`/admin/change-requests`)**: Review staged business edits before they go live.
  - **Customer Inquiries & Helpdesk (`/admin/inquiries`)**: Oversee all platform customer inquiries, triage issues, or assist cafe owners in responding to inquiries.
- **Editorial CMS & Scheduled Publishing (`/admin/blog`, `/admin/lists`)**:
  - Draft, schedule, and publish magazine posts and curated lists.
  - Automatic background scheduler (`schedulerService`) that publishes scheduled items at target timestamps.
  - **Revision History & Rollback (`RevisionHistoryDialog`)**: Inspect immutable snapshots of prior versions and restore them in one click.
  - **Automated Content Quality Audits (`/admin/content/quality`)**: Automated health checks flagging missing cover photos, empty descriptions, or broken schedules.
  - **301/302 URL Redirect Governance (`/admin/redirects`)**: Manage path redirects to preserve SEO when slugs change.
- **Centralized Media Library (`/admin/media`)**:
  - Manage all uploaded images, edit SEO alt text and captions, and check active entity dependencies before deleting files.
- **User Management (`/admin/users`)**:
  - Search accounts, modify roles (`USER`, `OWNER`, `ADMIN`), and update account statuses (`ACTIVE`, `SUSPENDED`).
- **Platform Observability & System Tools (`/admin/system`)**:
  - Real-time telemetry (RAM, uptime, DB latency, HTTP requests), database integrity audits, one-click rating recalculation, scheduled maintenance jobs, and automated deployment history.

---

## 🛠️ Technology Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, `motion/react`, Recharts, `lucide-react`, React Helmet Async |
| **Backend** | Node.js (`v20+` / `v22+` LTS), Express 4, TypeScript (`tsx`), Prisma ORM 6, PostgreSQL |
| **Embedded DB** | `@electric-sql/pglite` (Zero-config embedded PostgreSQL server on port 5445 for instant local dev) |
| **Maps & Geocoding** | Google Maps Platform (`@react-google-maps/api`, `@vis.gl/react-google-maps`) |
| **Security & Media** | BcryptJS, Express Rate Limit, Helmet, Multer, Sharp (dynamic image resizing), Zod validation, HTTP-only Cookie + Bearer token auth |
| **Testing & DevOps** | Preflight deployment checks, database integrity scanner, automated SQL migration safety checks |

---

## 💻 Installation & Setup Guide

### System Prerequisites
- **Node.js**: `v20.x` or `v22.x` LTS
- **npm**: `v10+`
- **Database**:
  - **Option 1 (Default / Zero-Config)**: Built-in **Embedded PostgreSQL (PGlite)** — starts automatically without installing PostgreSQL.
  - **Option 2 (Production / Dedicated)**: PostgreSQL 14+ or Google Cloud SQL instance.
- **Google Maps API Key** *(Optional for basic local use; required for live interactive maps)*: Enable *Maps JavaScript API* and *Places API*.

---

### Step 1: Clone the Repository & Install Dependencies

```bash
git clone <repository-url>
cd cafefinder
npm install
```

---

### Step 2: Configure Environment Variables

Create your local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Review and adjust the configuration values:

```env
# Application Runtime & Server Port
NODE_ENV=development
PORT=3000

# Database Configuration
# - For Dedicated PostgreSQL: Supply your postgres connection string.
# - For Embedded Zero-Config PGlite: Keep the default localhost connection;
#   if no external PG is running, the app automatically starts PGlite on port 5445.
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/cafefinder?schema=public"
PRISMA_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/cafefinder?schema=public"

# Security & Session Secrets
SESSION_SECRET="replace-with-a-secure-random-secret-string"

# Media Storage & Automated Backups
UPLOAD_DIR="./uploads"
BACKUP_DIR="./backups"

# Google Maps Platform (Optional for local testing, required for map rendering)
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

---

### Step 3: Initialize Database & Demo Data

#### Using Zero-Config Embedded Database (Default):
Run the development command. The app will boot the embedded PostgreSQL engine, apply schema tables, and seed initial Davao City cafes, amenities, curated lists, blog posts, loyalty programs, and demonstration accounts automatically:

```bash
npm run dev
```

#### Using an External PostgreSQL Server:
If you are connecting to a live PostgreSQL or Cloud SQL database, push the schema and seed the initial data:

```bash
# 1. Generate Prisma Client bindings
npm run db:generate

# 2. Synchronize schema tables with PostgreSQL
npm run db:push

# 3. Seed demonstration cafes, users, and taxonomy (Fresh setup only)
npm run db:seed

# 4. Seed realistic events and specials
npx tsx server/src/scripts/seed-events-specials.ts

# 5. Start the application
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

### Step 4: Verification & Preflight Checks

Run the automated verification suite to validate TypeScript types, database connectivity, write permissions, and migration safety:

```bash
npm run test
```

Expected output:
```text
[PASS] Node.js Version: Node.js v22.x
[PASS] Environment Variables: All required production variables configured
[PASS] Database Connectivity: PostgreSQL connection verified
[PASS] Directory & Writable: uploads/, backups/, logs/
[PASS] Migration Safety: Scanned migrations. No dangerous patterns found.
[SUCCESS]: Preflight verification passed. System is ready for deployment.
```

---

## 👥 Default Demonstration Accounts

For instant testing, use the 1-click login buttons on `/login` or enter these credentials:

| Role | Email | Password | Primary Portal Route |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `revero.b@agentsofvalue.com` | `password123` | `/admin` |
| **Admin User (Secondary)** | `admin@cafefinder.local` | `password123` | `/admin` |
| **Cafe Owner** | `owner@cafefinder.local` | `password123` | `/owner` |
| **Customer / Member** | `maria@example.com` | `password123` | `/profile` & `/dashboard/loyalty` |
| **Regular User** | `user@cafefinder.local` | `password123` | `/dashboard` |

---

## 📖 Detailed Instructions: How to Use the Application

### ☕ For Customers & Visitors

#### 1. Exploring & Filtering Davao Cafes
1. Navigate to **`/explore`** from the navigation bar.
2. Use the search input to look up cafe names, neighborhoods (e.g., *Poblacion*, *Matina*, *Lanang*), or specialties.
3. Toggle quick filters such as **"Open Now"**, **"Fast Wi-Fi"**, **"Power Outlets"**, **"Quiet Study"**, or **"Pet Friendly"**.
4. Adjust price filters (`₱` to `₱₱₱₱`) and sort by **Rating**, **Review Count**, or **Trending**.
5. Click **"View Map"** to switch to the full interactive Google Maps mode with live marker clustering.

#### 2. Joining Cafe Loyalty Programs & Tracking Membership
1. Sign in to your account (`/login`).
2. Open any participating cafe listing (e.g., *Green Coffee - Marfori*, *Glasshouse Coffee*, *Purge Coffee Roasters*).
3. In the **Loyalty Program Active** section:
   - If you are not yet a member: Click **"Join Loyalty Program"**. You will be instantly enrolled.
   - If you are already enrolled: The button automatically shows your **"Active Member"** badge and current points balance.
4. When visiting the cafe in person, click **"Check In for Visit"** to record your visit (e.g., earn 10 points per visit).
5. Click **"My Wallet"** or navigate to **`/dashboard/loyalty`** to track your lifetime earnings, redemption vouchers, and transaction history.

#### 3. Redeeming Rewards & Using Digital Vouchers
1. Go to **`/rewards`** or the **"Available Rewards"** tab on your Loyalty Dashboard (`/dashboard/loyalty`).
2. Select a reward within your points balance (e.g., *Free Espresso*, *15% Off Total Bill*, *Freshly Baked Pastry*).
3. Click **"Redeem Reward"**.
4. Your points are deducted and an active **Redemption Voucher** is generated with a unique voucher code.
5. In the **"Redemption Vouchers"** tab, click **"View Voucher Code"** to reveal your code.
6. Present the code to the cafe cashier or barista at checkout.
7. *Need to cancel?* If your voucher is still pending, click **"Cancel Request"** to immediately refund the points back to your balance.

#### 4. Discovering Events, Specials & Sending Inquiries (`/events`, `/specials`)
1. Click **"Events & Specials"** in the navigation bar or browse the **"Happening Now & Coming Soon"** section on the homepage.
2. Toggle between **"Upcoming Events"** (cuppings, workshops, latte art competitions, live music) and **"Active Specials"** (happy hours, combos, seasonal drinks).
3. Filter by neighborhood/city or event category, and look for countdown badges (*"Today"*, *"Tomorrow"*, *"In 3 days"*).
4. Click **"Ask About This Event"** or **"Ask About This Special"** on any cafe page to open the inquiry dialog.
5. Inquiries are instantly routed to the cafe owner's portal with full event or promo details pre-attached.

#### 5. Sending Direct Inquiries to Cafes (`ContactCafeModal`)
1. On any cafe page, click **"Message Cafe"** or the inquiry button in the event/special card.
2. Select an inquiry category (*General*, *Operating Hours*, *Menu*, *Reservations*, *Event*, *Special Offer*, *Private Event*).
3. Enter your subject and message. (If not logged in, provide your guest name and email so the cafe can reply).
4. Submit the inquiry. Track replies under **`/dashboard/inquiries`**.

#### 6. Writing Reviews & Bookmarking Favorites
1. On any cafe page, click the **Heart icon** to save the cafe to your Favorites (`/favorites`).
2. Scroll to the Community Reviews section and click **"Write a Review"**.
3. Rate the cafe (1 to 5 stars), enter your review text, upload photos, and rate specific workspace criteria (Wi-Fi speed, noise level, outlet availability).
4. Submit your review; cafe aggregate ratings update automatically.

---

### 🏪 For Cafe Owners (`/owner`)

#### 1. Claiming Your Cafe Listing
1. Locate your cafe on the directory (`/cafes/:slug`).
2. Click **"Claim this Business"** located below the cafe title.
3. Complete the ownership claim form with your business contact information and proof of ownership (e.g., Mayor's Permit, DTI Registration, or Official ID).
4. An administrator will review your claim under `/admin/claims`. Once approved, you gain access to the **Owner Workspace**.

#### 2. Managing Location, Hours & Menus
1. Go to **`/owner`** and select your cafe.
2. Under **"Edit Cafe"**, update the description, phone, email, website, and social links.
3. Under **"Operating Hours"**, set daily opening and closing hours, including split shifts or closed days.
4. Under **"Menu"**, add food and coffee categories, item descriptions, and prices.
5. Submit changes. Staged updates are reviewed by moderation to ensure directory quality.

#### 3. Setting Up a Digital Loyalty Program
1. Navigate to **`/owner/loyalty`**.
2. Toggle your program status to **Active**.
3. Set your **Points Awarded Per Visit** (e.g., 10 pts) and **Minimum Redemption Points** threshold.
4. Add terms and conditions for your customers.
5. Under **"Catalog Rewards"**, click **"Add New Reward"**:
   - Enter Reward Name (e.g., *Complimentary Cold Brew*).
   - Set the Points Cost (e.g., 50 points).
   - Specify stock limits or terms if applicable.
6. Click **"Save Reward"**. Customers can now discover and redeem this reward immediately.

#### 4. Verifying Customer Vouchers at Checkout (POS)
1. When a customer presents a loyalty voucher code, open **`/owner/loyalty`** and navigate to the **"Redemptions"** tab.
2. Search by customer name or voucher code hint.
3. Click **"Verify & Redeem"**.
4. Confirm the voucher code matches the customer's screen.
5. Click **"Mark as Redeemed"**. The voucher status transitions to `REDEEMED`, preventing duplicate redemptions.

#### 5. Hosting Events, Specials & Publishing Announcements
1. Go to your cafe details page in the Owner Portal (`/owner/cafes/:id`).
2. Click **"Events & Specials"** (`/owner/cafes/:id/events`).
3. To host an event:
   - Click **"New Event"**.
   - Enter title, event type (Cupping/Tasting, Workshop, Competition, Live Music, Community), pricing, schedule, and area.
   - Choose **"Publish immediately"** or save as a draft.
4. To launch a promotion:
   - Click **"New Special"**.
   - Enter title, special type (Seasonal, Happy Hour, Combo, Discount, BOGO), percentage discount or package price, valid dates, and terms.
5. To post an urgent or priority update:
   - Click the **"Announcements"** tab and click **"New Announcement"**.
   - Set priority (`NORMAL`, `IMPORTANT`, `URGENT`) and message content.
6. Manage active items with real-time **"Publish Now"** triggers or the **Delete** button. Followers are automatically notified in the background.

#### 6. Managing Customer Inquiries (`/owner/inquiries`)
1. Open **`/owner/inquiries`** to view all questions received from customers.
2. Filter by status (`NEW`, `READ`, `RESPONDED`, `CLOSED`) or search by customer name.
3. Click on any inquiry to inspect the customer's question and any attached event or special promotion context.
4. Type your reply in the thread and click **"Send Reply"**. The customer is instantly notified.

---

### 🛡️ For System Administrators (`/admin`)

#### 1. Managing Moderation Queues
1. Sign in with an Administrator account (`revero.b@agentsofvalue.com` or `admin@cafefinder.local`).
2. Access the Admin Panel at **`/admin`**.
3. Review pending submissions across moderation queues:
   - **Cafe Submissions (`/admin/submissions`)**: Inspect submitted cafe addresses, photos, and amenities. Click **Approve** to publish or **Reject** with feedback.
   - **Owner Claims (`/admin/claims`)**: Verify submitted business permits. Approving a claim automatically upgrades the user to the `OWNER` role and assigns ownership.
   - **Reviews & Flagged Reports (`/admin/reviews`, `/admin/review-reports`)**: Review reported community content, hide policy-violating reviews, or resolve reports.
   - **Cafe Change Requests (`/admin/change-requests`)**: Compare side-by-side diffs of owner modifications and merge approved updates to live listings.
   - **Customer Inquiries & Helpdesk (`/admin/inquiries`)**: Oversee platform inquiries and customer satisfaction.

#### 2. Editorial CMS & Automated Scheduled Publishing
1. Navigate to **`/admin/blog`** (Articles) or **`/admin/lists`** (Curated Lists).
2. Click **"Create Article"** or **"Create Curated List"**.
3. Write content using the structured editor, assign cover photos, select cafes, and set publication status:
   - `DRAFT`: Saved privately for editing.
   - `PUBLISHED`: Immediately visible to the public.
   - `SCHEDULED`: Specify a future date and time. The built-in scheduler (`schedulerService`) automatically changes the status to `PUBLISHED` when the scheduled time arrives.
4. **Revision History & Rollback**:
   - Open any article or list and click **"Revision History"**.
   - Browse previous version snapshots with author and timestamp.
   - Click **"Restore Version"** to instantly revert content without data loss.

#### 3. Content Quality Audits & URL Redirects
1. **Content Quality Audits (`/admin/content/quality`)**:
   - Click **"Run Audit"** to scan all directory records.
   - Review flagged issues (e.g., cafes missing photos, incomplete hours, uncategorized listings).
   - Click **"Publish Scheduled Now"** to manually force background publishing triggers.
2. **URL Redirects Governance (`/admin/redirects`)**:
   - Create 301 (Permanent) or 302 (Temporary) redirects when cafes or articles are renamed.
   - Search, toggle active states, or delete outdated redirect paths.

#### 4. System Health & Infrastructure Management
1. Navigate to **`/admin/system`**.
2. **Metrics & Telemetry**: Inspect real-time server memory, process uptime, database latency, and HTTP request rates.
3. **Rating Integrity Check**: Click **"Recalculate All Ratings"** to re-aggregate all cafe ratings from approved reviews in the database.
4. **Maintenance Mode**: Toggle global maintenance mode to temporarily display an informational maintenance screen to public users during updates (admins bypass maintenance automatically).

---

## 🔄 Deployment, Upgrade & Backup Procedures

### Safe Zero-Downtime Deployment Pipeline
The application includes an automated 9-step deployment pipeline (`npm run deploy`):

```bash
# 1. Pull latest code from main branch
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Execute automated deployment pipeline
npm run deploy
```

**Automated Pipeline Operations:**
1. Verifies node version, disk write permissions, and environment variables.
2. Generates pre-deployment backups of PostgreSQL and the `uploads/` directory.
3. Scans all Prisma SQL migrations for destructive operations (`DROP TABLE`, `TRUNCATE`).
4. Applies pending migrations safely via `npx prisma migrate deploy`.
5. Compiles frontend production assets and backend server bundles.
6. Executes post-deployment smoke tests against the live server.

### Automated Backups & Restoration
Create manual on-demand snapshots of database and media assets:

```bash
# Backup both PostgreSQL database and uploaded photos
npm run backup:all

# Standalone database backup
npm run backup:db

# Standalone media files archive
npm run backup:uploads

# Test backup restoration integrity in an isolated sandbox
npm run db:restore-test
```

Backups are saved to the configured `BACKUP_DIR` (defaults to `./backups`).

### Rollback Procedure
If a production deployment fails health checks, roll back immediately:

```bash
npm run rollback
```

---

## 📜 NPM Commands Quick Reference

| Command | Description | Safe for Existing Data? |
| :--- | :--- | :--- |
| `npm run dev` | Starts dev server on port 3000 (auto-seeds **only** if database is empty) | ✅ Yes |
| `npm run build` | Compiles Vite frontend, Prisma client, and backend bundle | ✅ Yes |
| `npm run start` | Launches compiled production server | ✅ Yes |
| `npm run test` | Runs TypeScript linter (`tsc --noEmit`) and deployment preflight checks | ✅ Yes |
| `npm run lint` | Type-checks codebase with zero emit | ✅ Yes |
| `npm run deploy` | Full automated backup, migration check, build, and deploy pipeline | ✅ Yes |
| `npm run rollback` | Reverts to last verified backup build | ✅ Yes |
| `npm run backup:all` | Creates complete snapshot of PostgreSQL data and uploads directory | ✅ Yes |
| `npm run db:restore-test`| Validates database backup restoration integrity | ✅ Yes |
| `npm run db:push` | Synchronizes additive Prisma schema changes with database | ✅ Yes |
| `npm run db:generate` | Regenerates Prisma TypeScript client types | ✅ Yes |
| `npx tsx server/src/scripts/seed-events-specials.ts` | Seeds upcoming cuppings, latte art throwdowns, workshops, and active specials | ✅ Yes |
| `npm run db:seed` | Wipes and populates fresh demonstration records | ⚠️ **Fresh installs only** |

---

## 🔒 Security & Privacy Best Practices

- **Dual Authentication**: Client requests automatically pass JWT bearer tokens via the `fetchApi` utility, with HTTP-only cookie failover for resilient cross-context authentication.
- **Input Sanitization & Validation**: All user-submitted review texts, descriptions, and comments are sanitized using `sanitize-html` and validated against strict `Zod` schemas.
- **Image Optimization & Metadata Scrubbing**: Uploaded images are re-encoded and resized using `Sharp` to strip sensitive EXIF GPS data and reduce bandwidth usage.
- **Rate Limiting**: Critical endpoints (login, registration, check-ins, voucher redemptions, review submissions, inquiries) are protected by IP and user rate limiters.

---

*CafeFinder Davao — Built for specialty coffee discovery, community trust, and cafe operations.*
