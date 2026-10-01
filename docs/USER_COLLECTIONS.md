# User Collections

User collections organize published cafes without replacing Favorites. Favorites remain the quick saved relationship in `CafeFavorite`; a cafe can be favorited, belong to multiple collections, or both.

## Privacy

New collections default to `PRIVATE`. Private collections and notes are returned only through authenticated, owner-scoped endpoints. A collection becomes `PUBLIC` only after an explicit visibility update. Public responses include only the collection, active creator display fields, published cafes, public cafe photos, and notes in that public collection.

Deactivated users and private collections are excluded from public collection responses. Unpublished cafes are never added to a collection and are filtered from public output.

## URLs and API

- Authenticated management: `/dashboard/collections` and `/dashboard/collections/:slug`
- Public page: `/collections/:slug`
- Public API: `GET /api/collections/public/:slug`
- Authenticated API: `GET|POST /api/collections`, `GET|PUT|DELETE /api/collections/:id-or-slug`
- Items: `POST|DELETE /api/collections/:id/cafes`, `PUT /api/collections/:id/items/:itemId`, and reorder support at `/items/reorder`

Collection slugs are globally unique and remain stable when a title changes. Internal user and collection IDs are not used in public URLs.

## Data lifecycle and security

`UserCollection` belongs to a User and `UserCollectionItem` belongs to a collection and Cafe. Foreign keys cascade with their parent records, duplicate cafes are prevented by a composite unique constraint, and cover cafes use an existing cafe photo. All write bodies use strict Zod schemas, plain-text sanitization, and owner checks to prevent IDOR and mass assignment.

Dashboard collection pages emit `noindex`; only explicit public collections are indexable. Private collection data is not included in public search, recommendation responses, sitemap data, analytics content, or notifications. Private API responses must not be placed in shared or public caches.
