# Time-Sensitive Cafe Content

Cafe events, specials, and announcements are cafe-owned records. They use the existing Cafe, User, MediaAsset, ActivityLog, authentication, maintenance-job, and admin authorization systems.

## Lifecycle

Owners can create drafts for cafes they own and submit drafts or rejected content for review. Owner edits to published content return it to `PENDING_REVIEW`; owners cannot set status, publication time, or featured state. Admin moderation can publish pending content, reject, cancel, archive, restore to review, and feature events or specials. Administrative changes are written to ActivityLog. Historical records are retained.

Public queries require a published cafe and published content. Discovery queries filter by time in PostgreSQL: active records have started and not ended; upcoming records have not started and have not ended. Expired records are not included in discovery. Public detail paths are scoped by cafe slug and content slug: `/events/:cafeSlug/:slug`, `/specials/:cafeSlug/:slug`, and `/announcements/:cafeSlug/:slug`.

## Time and Validation

`startAt` and `endAt` are stored as UTC instants. API writes require ISO datetimes with an explicit UTC offset and an IANA `timezone` value. Clients convert cafe-local wall times to UTC using the selected IANA timezone; rendering uses the content timezone. The server validates ranges and timezone identifiers. Registration URLs accept only HTTP or HTTPS. Content descriptions are sanitized before storage and rendered as text in the client.

## API

- `GET /api/events`, `/api/specials`, `/api/announcements`: bounded, paginated public discovery; supports `scope`, `q`, `type`, `city`, `cafeId`, date, and price filters.
- `GET /api/events/:cafeSlug/:slug`, with equivalent specials and announcements paths: published public detail.
- `GET|POST /api/owner/{events|specials|announcements}` and `PUT /api/owner/{kind}/:id`: owner-scoped listing and draft management.
- `POST /api/owner/{kind}/:id/submit`, `/cancel`, and `/archive`: owner lifecycle actions.
- `GET /api/admin/time-sensitive/{kind}` and `PATCH /api/admin/time-sensitive/{kind}/:id`: admin queues and moderation.

Owner write requests use strict Zod schemas, rate limits, cafe ownership checks, safe URL validation, and cover-asset ownership checks. Public lists cap page size at 50.

## Maintenance, SEO, and Diagnostics

The existing scheduler and admin job runner invoke `expire_time_sensitive_content`. It updates at most 500 expired records per content type per run, is repeat-safe, and never deletes records. Public queries independently enforce expiration. Published event and special detail URLs are added to the existing sitemap, with a bounded 5,000 records per content type. The existing data-integrity report includes time-sensitive counts, invalid schedule ranges, timezones, and registration links.

## Verification

Run `npx prisma validate`, `npm run db:migrate -- --name stage38_time_sensitive_content`, `npm run lint`, and `npm run build`. The repository currently has no dedicated test runner for API lifecycle/security tests.
