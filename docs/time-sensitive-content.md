# Stage 38 — Time-sensitive cafe content

CafeFinder supports owner-submitted events and specials through the existing authentication, authorization, activity-log, Prisma, and notification architecture.

## Lifecycle

Owners create content as `DRAFT`, then submit it as `PENDING_REVIEW`. Administrators can transition pending content to `PUBLISHED`, `REJECTED`, `CANCELLED`, or `ARCHIVED`. Public APIs only return published content belonging to published cafes and whose end time has not passed. Expired records are retained and the maintenance scheduler marks them `EXPIRED`.

## Timezones

Dates are stored as UTC `DateTime` values. The submitted IANA timezone is stored with each record and is used by the frontend for locale-aware display. API validation requires ISO timestamps with offsets and rejects invalid ranges.

## APIs

- `GET /api/time-sensitive/events`
- `GET /api/time-sensitive/events/:slug`
- `GET /api/time-sensitive/specials`
- `GET /api/time-sensitive/specials/:slug`
- `GET /api/time-sensitive/cafes/:cafeId`
- `GET /api/time-sensitive/owner/events`
- `GET /api/time-sensitive/owner/specials`
- `POST /api/time-sensitive/owner/events/:cafeId`
- `POST /api/time-sensitive/owner/specials/:cafeId`
- `POST /api/time-sensitive/owner/events/:id/submit`
- `POST /api/time-sensitive/owner/specials/:id/submit`
- `POST /api/time-sensitive/admin/events/:id/moderate`
- `POST /api/time-sensitive/admin/specials/:id/moderate`

Public directory and detail routes are available at `/events`, `/events/:slug`, `/specials`, and `/specials/:slug`.

## Security and performance

Owner creation verifies the authenticated owner against `Cafe.ownerId`. Content is sanitized as plain text, registration URLs accept only HTTP(S), public listings are paginated and database-filtered, and scoped cafe/slug uniqueness prevents collisions. Cover media and full owner editing forms remain deferred to the existing media workflow rather than introducing a second uploader.

## Maintenance and SEO

The `expire-time-sensitive-content` scheduled job updates ended published records idempotently. The sitemap includes current published event and special pages and excludes ended or non-public records.
