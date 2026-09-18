# CafeFinder Davao

CafeFinder Davao is a full-stack cafe discovery and ownership platform for Davao City. Visitors can explore published cafes, search and filter listings, view maps and profiles, save favorites, and read reviews. Authenticated users can submit cafes and reviews, while approved cafe owners receive a secure management workspace.

## Recent Updates (September 2026)

- **Database Migration**: Successfully migrated the entire platform from PostgreSQL to **MariaDB**.
- **Search Optimization**: Implemented native MariaDB `@@fulltext` indexes for improved search performance across cafes and amenities.
- **Improved Connection Handling**: Enhanced the database configuration logic to automatically construct connection strings from individual host/user/password variables.
- **UI Refinement**: Updated the hero section with a new, engaging call-to-action: *"Your next favorite local coffee scene is just a click away!"*
- **Full-Stack Performance**: Optimized raw SQL analytics queries for MariaDB compatibility using `DATE_FORMAT`.

## Current Features

### Discovery and Public Directory

- Browse published cafes from the home and Explore pages.
- Search by cafe name, description, city, and address.
- Filter by city, price range, amenities, rating, verified status, featured status, and trending status.
- Sort by latest, name, rating, and popularity.
- View cafes on the configured Google Maps interface.
- Open detailed cafe profiles with photos, hours, amenities, contact information, social links, directions, related cafes, and public reviews.
- Use responsive layouts on desktop, tablet, and mobile screens.

### Accounts and Authentication

- Register and sign in with email and password.
- Use database-backed sessions stored in the `Session` model.
- Authenticate with an HTTP-only cookie. The browser does not use localStorage for authentication tokens.
- Sessions persist across refreshes and navigation.
- Roles:
  - `USER`: normal authenticated user.
  - `OWNER`: user with at least one administrator-approved cafe claim.
  - `ADMIN`: platform administrator.
- Role and status changes are server-controlled.
- Logout invalidates the current session.

### Reviews and Favorites

- Authenticated users can create reviews with ratings and comments.
- Review photos can be uploaded using JPEG, PNG, or WebP files up to 10 MB each.
- Users can edit and delete their own reviews according to the existing review rules.
- Administrators can approve, reject, hide, restore, and moderate reviews.
- Users can favorite and unfavorite cafes.
- Favorite state is reflected in cafe listings and profiles.
- Owners can view reviews for their own cafes but cannot edit ratings, comments, or review status.

### Cafe Submissions

- Authenticated users can submit a new cafe through a multi-step form.
- Submissions support cafe information, location, contact details, social links, amenities, and photos.
- Duplicate pending submissions are checked.
- Users can view, edit, cancel, and track their submissions.
- Administrators can review, approve, reject, and reopen submissions.
- Approved submissions create published cafe listings through a transactional server workflow.

### Owner Claims

- Authenticated users can claim an existing published cafe.
- A claim is always created as `PENDING`.
- Submitting a claim never grants ownership automatically.
- Duplicate pending claims are rejected.
- Claims for unpublished or already-owned cafes are rejected.
- Users can view, edit, and cancel their own pending claims.
- Administrators can list, inspect, approve, reject, and reopen claims.
- Approval transactionally:
  - Assigns `Cafe.ownerId`.
  - Promotes a `USER` to `OWNER`.
  - Preserves `OWNER` and `ADMIN` roles correctly.
  - Records activity logs.
  - Creates owner notifications.
- Public cafe responses expose coarse claim state without exposing owner identity.

### Owner Cafe Management

Approved owners can access `/owner` and manage only cafes assigned to their account.

Owner functionality includes:

- Owner dashboard statistics scoped to owned cafes.
- Owned cafe list with status, verification, rating, reviews, photos, and favorites.
- Cafe management overview.
- Direct updates for whitelisted low-risk business fields:
  - Short description.
  - Description.
  - Phone.
  - Email.
  - Website.
  - Instagram.
  - Facebook.
  - Price range.
- Weekly hours management, including overnight hours such as `21:00` to `02:00`.
- Active amenity selection.
- Cafe photo upload, delete, and cover-photo selection.
- Owner review viewing.
- Location change requests with address, city, country, postal code, latitude, and longitude.
- Change-request history and cancellation for pending requests.

Owners cannot modify:

- `ownerId`
- `verified`
- `featured`
- `trending`
- `ratingAverage`
- `reviewCount`
- Cafe publication status.
- Review status or review content.
- Claim status.

### Cafe Change Requests

Higher-risk owner changes are represented by `CafeChangeRequest` records and require administrator review.

Supported request types:

- `BUSINESS_INFO`
- `LOCATION`
- `HOURS`
- `AMENITIES`
- `PHOTOS`
- `OTHER`

Administrators can approve or reject pending requests. Approval applies only explicitly permitted fields in a transaction and creates activity logs and owner notifications. Rejection requires a reason.

### Admin Portal

The admin portal is available at `/admin` for `ADMIN` users only.

Admin areas include:

- Dashboard metrics.
- Cafe submissions.
- User reviews.
- Owner claims.
- Cafe change requests.
- Cafe directory management.
- User status management.
- Activity logs.

Every admin API is protected by both authentication and the `ADMIN` role.

## Technology Stack

### Frontend

- React 19.
- TypeScript.
- Vite.
- React Router.
- Tailwind CSS.
- `motion/react` for animations.
- Lucide React icons.
- Google Maps integration through `@react-google-maps/api`.
- React Context for authentication state.

### Backend

- Node.js.
- Express.
- TypeScript.
- Prisma ORM.
- MariaDB / MySQL through the Prisma datasource configuration.
- Zod request validation.
- HTTP-only cookie sessions.
- Multer for controlled image uploads.
- Sharp is available for image-related processing where needed.

### Database and Storage

- Prisma schema: `prisma/schema.prisma`.
- Migrations: `prisma/migrations`.
- Development uploads: `uploads/`.
- Database sessions: `Session` model.
- Notifications: `Notification` model.
- Audit records: `ActivityLog` model.

## Requirements

Install these before setup:

- Node.js 22 or newer.
- npm.
- MariaDB (10.4+) or MySQL (8.0+) instance.
- A Google Maps API key for map features.
- Git, if cloning the repository.

The repository uses MariaDB/MySQL through `PRISMA_DATABASE_URL`. The application is optimized for MariaDB with full-text search capabilities.

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a root `.env` file. A minimal local configuration is:

```env
# Database configuration
PRISMA_DATABASE_URL="mysql://user:password@host:3306/dbname"
DB_USERNAME="your-db-user"
DB_PASSWORD="your-db-password"
DB_HOST="your-db-host"
DB_NAME="your-db-name"
DB_PORT="3306"

# Maps configuration
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
VITE_MAP_PROVIDER="google"
VITE_MAP_API_KEY="your-google-maps-api-key"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
MAP_PROVIDER="google"
MAP_API_KEY="your-google-maps-api-key"
```

The server constructs the final Prisma connection string automatically from these variables. Ensure your database user has sufficient privileges for creating indexes.

Do not commit real passwords, private keys, or production credentials.

### 3. Apply the database schema

For a new or existing development database, use migrations:

```bash
npx prisma migrate dev
```

The current repository includes migrations for the owner claim and cafe change-request workflows.

To regenerate Prisma Client without changing the database:

```bash
npm run db:generate
```

Do not use `prisma db push` for production schema changes. The `npm run db:push` script remains available for disposable local experiments only.

### 4. Seed development data

```bash
npm run db:seed
```

The seed recreates development data, including:

- Demo users.
- Amenities.
- Published cafes.
- Cafe photos and hours.
- Reviews.
- Approved, pending, and rejected owner-claim scenarios.
- Testimonials, blog posts, and curated lists.

The seed deletes existing development records before recreating them. Do not run it against a database containing data you need to keep.

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The Express server hosts the Vite development middleware and API from the same port.

If you see `EADDRINUSE` for port `3000`, an existing development server is already running. Use that server or stop the existing Node process before starting another one. Do not start multiple copies of the app on the same port.

## Demo Accounts

The development seed uses the password `password123` for all demo accounts:

| Email | Password | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `admin@cafefinder.local` | `password123` | `ADMIN` | Admin portal and moderation |
| `owner@cafefinder.local` | `password123` | `OWNER` | Owner dashboard and cafe management |
| `user@cafefinder.local` | `password123` | `USER` | Standard user workflows |
| `maria@example.com` | `password123` | `USER` | Review and claim testing |
| `john@example.com` | `password123` | `USER` | Review and claim testing |

Change or remove these credentials before deploying anywhere public.

## Important Routes

### Public and authenticated frontend routes

| Route | Access | Purpose |
| :--- | :--- | :--- |
| `/` | Public | Home page |
| `/explore` | Public | Search and filter cafes |
| `/cafes/:slug` | Public | Cafe profile |
| `/cafes/:slug/claim` | Authenticated | Submit a cafe claim |
| `/favorites` | Authenticated | Saved cafes |
| `/profile` | Authenticated | User profile |
| `/submit-cafe` | Authenticated | Submit a new cafe |
| `/my-submissions` | Authenticated | Track cafe submissions |
| `/owner` | `OWNER`, `ADMIN` | Owner dashboard |
| `/owner/cafes` | `OWNER`, `ADMIN` | Owned cafe list |
| `/owner/cafes/:id` | `OWNER`, `ADMIN` | Cafe management overview |
| `/owner/cafes/:id/edit` | `OWNER`, `ADMIN` | Business information |
| `/owner/cafes/:id/location` | `OWNER`, `ADMIN` | Moderated location request |
| `/owner/cafes/:id/hours` | `OWNER`, `ADMIN` | Business hours |
| `/owner/cafes/:id/amenities` | `OWNER`, `ADMIN` | Cafe amenities |
| `/owner/cafes/:id/photos` | `OWNER`, `ADMIN` | Cafe photos |
| `/owner/cafes/:id/reviews` | `OWNER`, `ADMIN` | Owner review view |
| `/owner/cafes/:id/change-requests` | `OWNER`, `ADMIN` | Change-request history |
| `/owner/claims` | `OWNER`, `ADMIN` | Owner claims |
| `/admin` | `ADMIN` | Admin dashboard |
| `/admin/submissions` | `ADMIN` | Cafe submission moderation |
| `/admin/reviews` | `ADMIN` | Review moderation |
| `/admin/claims` | `ADMIN` | Owner claim moderation |
| `/admin/change-requests` | `ADMIN` | Cafe change-request moderation |
| `/admin/cafes` | `ADMIN` | Cafe directory management |
| `/admin/users` | `ADMIN` | User administration |
| `/admin/activity` | `ADMIN` | Audit logs |

## API Reference

All API requests are relative to `http://localhost:3000/api` during development. Authenticated requests use the HTTP-only `cafefinder_session` cookie automatically through the frontend API client.

### Authentication

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a user account |
| `POST` | `/api/auth/login` | Start a session |
| `POST` | `/api/auth/logout` | End a session |
| `GET` | `/api/auth/me` | Restore the current session user |

### Public cafe and directory APIs

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/cafes` | Published cafe list with search, filters, sorting, and pagination |
| `GET` | `/api/cafes/:slug` | Published cafe profile |
| `GET` | `/api/amenities` | Active amenities |
| `GET` | `/api/lists` | Curated lists |
| `GET` | `/api/blog` | Published blog posts |
| `GET` | `/api/testimonials` | Active testimonials |

### Reviews and favorites

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/reviews/cafe/:cafeId` | Create a review |
| `GET` | `/api/reviews/cafe/:cafeId` | View approved cafe reviews |
| `GET` | `/api/reviews/cafe/:cafeId/stats` | View rating statistics |
| `PATCH` | `/api/reviews/:id` | Edit an owned review |
| `DELETE` | `/api/reviews/:id` | Delete an owned review |
| `POST` | `/api/reviews/:id/photos` | Upload a review photo |
| `POST` | `/api/cafes/:cafeId/favorite` | Toggle a favorite |
| `DELETE` | `/api/cafes/:cafeId/favorite` | Remove a favorite |
| `GET` | `/api/user/me/favorites` | List current-user favorites |

### Cafe submissions

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/cafe-submissions` | Create a cafe submission |
| `GET` | `/api/cafe-submissions/me` | List current-user submissions |
| `GET` | `/api/cafe-submissions/:id` | View an owned submission |
| `PATCH` | `/api/cafe-submissions/:id` | Edit a pending submission |
| `DELETE` | `/api/cafe-submissions/:id` | Cancel a pending submission |
| `POST` | `/api/cafe-submissions/:id/photos` | Upload a submission photo |

### Owner claims

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/cafes/:cafeId/claim` | Submit a claim for a published unowned cafe |
| `GET` | `/api/cafe-owner-claims/me` | List current-user claims |
| `GET` | `/api/cafe-owner-claims/:id` | View an owned claim |
| `PATCH` | `/api/cafe-owner-claims/:id` | Edit a pending claim |
| `POST` | `/api/cafe-owner-claims/:id/cancel` | Cancel a pending claim |
| `GET` | `/api/admin/claims` | Admin claim list |
| `GET` | `/api/admin/claims/:id` | Admin claim detail |
| `POST` | `/api/admin/claims/:id/approve` | Approve a claim transactionally |
| `POST` | `/api/admin/claims/:id/reject` | Reject a claim with a reason |
| `POST` | `/api/admin/claims/:id/reopen` | Reopen a rejected or cancelled claim |

### Owner management

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/owner/dashboard` | Owner-scoped statistics |
| `GET` | `/api/owner/cafes` | Owned cafe list |
| `GET` | `/api/owner/cafes/:id` | Owned cafe detail |
| `PATCH` | `/api/owner/cafes/:id/business` | Update whitelisted business fields |
| `PUT` | `/api/owner/cafes/:id/hours` | Replace the seven-day schedule |
| `PUT` | `/api/owner/cafes/:id/amenities` | Replace active amenities |
| `GET` | `/api/owner/cafes/:id/reviews` | Read owner cafe reviews |
| `POST` | `/api/owner/cafes/:id/photos` | Upload a cafe photo |
| `DELETE` | `/api/owner/cafes/:id/photos/:photoId` | Delete an owned cafe photo |
| `POST` | `/api/owner/cafes/:id/photos/:photoId/cover` | Set a cover photo |
| `GET` | `/api/owner/cafes/:id/change-requests` | List cafe change requests |
| `POST` | `/api/owner/cafes/:id/change-requests` | Submit a moderation request |
| `POST` | `/api/owner/change-requests/:requestId/cancel` | Cancel a pending request |

### Admin moderation and management

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin statistics |
| `GET` | `/api/admin/cafe-submissions` | Submission moderation list |
| `POST` | `/api/admin/cafe-submissions/:id/approve` | Approve a submission |
| `POST` | `/api/admin/cafe-submissions/:id/reject` | Reject a submission |
| `GET` | `/api/admin/reviews` | Review moderation list |
| `POST` | `/api/admin/reviews/:id/approve` | Approve a review |
| `POST` | `/api/admin/reviews/:id/reject` | Reject a review |
| `POST` | `/api/admin/reviews/:id/hide` | Hide a review |
| `GET` | `/api/admin/change-requests` | Change-request moderation list |
| `GET` | `/api/admin/change-requests/:id` | Change-request detail |
| `POST` | `/api/admin/change-requests/:id/approve` | Apply a request transactionally |
| `POST` | `/api/admin/change-requests/:id/reject` | Reject with a reason |
| `GET` | `/api/admin/cafes` | Admin cafe list |
| `PATCH` | `/api/admin/cafes/:id/status` | Change cafe status |
| `PATCH` | `/api/admin/cafes/:id/toggle-flag` | Toggle verified/featured/trending flags |
| `GET` | `/api/admin/users` | Admin user list |
| `PATCH` | `/api/admin/users/:id/status` | Change user status |
| `GET` | `/api/admin/activity-logs` | Audit logs |

## File Upload Rules

Cafe, submission, and review photo uploads use generated server-side filenames and are stored below `uploads/`.

- Accepted MIME types: JPEG, PNG, WebP.
- Maximum file size: 10 MB per image.
- Owner cafes have a maximum of 20 photos.
- Uploaded original filenames are never used as filesystem paths.
- SVG, HTML, JavaScript, PHP, executable, and other non-image uploads are rejected.
- Deleting a cover photo promotes another cafe photo when available.

## Database Workflow

Useful commands:

```bash
# Validate schema without changing the database
npx prisma validate

# Show migration state
npx prisma migrate status

# Create and apply a development migration
npx prisma migrate dev --name describe_your_change

# Regenerate Prisma Client
npm run db:generate

# Reset and reseed a disposable development database
npm run db:seed
```

Use migrations for schema changes. Avoid resetting or seeding any database that contains data you need to preserve.

## Development Commands

```bash
npm run dev          # Start Express and Vite on port 3000
npm run build        # Generate Prisma Client, build Vite, bundle the server
npm run start        # Start the production bundle from dist
npm run lint         # TypeScript validation
npm run clean        # Remove dist output on Unix-like shells
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run Prisma migrate dev
npm run db:seed      # Seed demo data
npm run scrape:cafes # Run the cafe scraper
```

On Windows PowerShell, `npm run clean` may require manual removal of the `dist` directory because the script uses `rm -rf`.

## Troubleshooting

### Port 3000 is already in use

The app uses port `3000` by default. Check for an existing Node process before starting another server:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
Get-Process node
```

Stop only the stale process if necessary, then run `npm run dev` again.

### Prisma reports `EPERM` while replacing the query engine

A running Node process is holding Prisma's Windows query engine. Stop stale development servers, then run:

```powershell
Get-Process node | Stop-Process -Force
npx prisma generate
```

Do not delete the database to resolve an `EPERM` file-lock error.

### Prisma reports schema drift

First inspect the database and migration state:

```bash
npx prisma migrate status
```

For a disposable local database, `npx prisma migrate reset` followed by `npm run db:seed` can recreate it. This deletes all data in that database. Never use reset for production data.

### The admin portal shows access denied

Use an account with `ADMIN` role. The seed account is:

```text
admin@cafefinder.local
password123
```

Normal users and owners are intentionally denied access to `/admin` and `/api/admin/*`.

### The owner portal shows access denied

The signed-in account must have `OWNER` or `ADMIN` role, and an `OWNER` must own at least one cafe through an approved claim. Claim submission alone does not grant ownership.

### Maps do not render

Confirm the Google Maps key is present in the Vite environment variables and that the required Maps API is enabled for the key. The owner location workflow still supports moderated manual coordinates when interactive map configuration is unavailable.

### Login appears to disappear after refresh

Confirm that:

- The server is running on the same origin used by the browser.
- The browser allows cookies.
- `/api/auth/me` returns the current user.
- The server session exists and has not expired.

The frontend sends `credentials: 'include'` for API requests, and authentication is stored in an HTTP-only cookie.

## Security Model

The backend is authoritative for authentication, roles, ownership, moderation, and protected fields.

- Frontend route guards improve UX but are not security boundaries.
- Owner endpoints load the cafe from the database and verify `ownerId`.
- Admin endpoints require `requireAuth` and `requireRole('ADMIN')`.
- Owner update endpoints use explicit field whitelists.
- User input is validated with Zod.
- Change-request approval applies only permitted fields.
- Public cafe DTOs do not expose private owner identity unnecessarily.
- Passwords, cookies, sessions, and secrets are never written to activity logs.

## Project Structure

```text
client/
  src/
    components/       Shared UI, cafe, admin, map, auth, and layout components
    contexts/         Authentication context
    pages/            Public, owner, and authenticated pages
    services/         Frontend API services
    types.ts          Shared frontend types
server/
  src/
    controllers/      HTTP request handlers
    dtos/             API response and request DTOs
    middleware/       Auth, uploads, and error handling
    repositories/     Prisma data access helpers
    routes/           Express route definitions
    services/         Business logic and transactions
prisma/
  schema.prisma      Database schema
  migrations/        Prisma migrations
server/prisma/seed.ts Development seed data
uploads/              Local development photo storage
```

## Validation Checklist

Before opening a pull request or deploying:

```bash
npm run lint
npx prisma validate
npx prisma migrate status
npm run build
```

For owner-management changes, also manually verify:

1. A normal user cannot access `/admin` or `/owner`.
2. An owner can access only cafes assigned to that owner.
3. Protected field manipulation is rejected.
4. Business updates appear on the public profile.
5. Overnight hours save correctly.
6. Amenities and photos update only for the owned cafe.
7. Change requests remain pending until admin approval.
8. Admin rejection requires a reason.
9. Public cafes remain limited to `PUBLISHED` records.

## Project Status

Completed application areas include:

- Cafe discovery and search.
- Maps and cafe profiles.
- Favorites.
- Reviews and review moderation.
- Cafe submissions and submission moderation.
- Authentication and role protection.
- Owner claims and transactional approval.
- Owner dashboard.
- Owner cafe management.
- Cafe change-request moderation.
- Notifications and audit logging for moderation workflows.

The project intentionally does not include billing, subscriptions, reservations, messaging, loyalty programs, marketing automation, or other unrelated future features.
