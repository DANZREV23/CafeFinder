# User Collections

CafeFinder now supports user-owned cafe collections alongside the existing favorites system.

## Privacy model

- `PRIVATE` is the default visibility for any new collection.
- `PUBLIC` must be explicitly selected.
- Private collections are only returned to the owner and are never exposed in public APIs or search.
- Public collections are exposed only through the public collection URL and only include published cafes.

## Favorites vs Collections

Favorites remain the canonical quick-save relationship. Collections are a user-organized grouping of cafes for planning, study lists, date ideas, or personal discovery boards. A cafe may be favorited and saved to one or many collections at the same time.

## API endpoints

Private endpoints:

- `GET /api/collections/me`
- `POST /api/collections`
- `GET /api/collections/:id`
- `PUT /api/collections/:id`
- `DELETE /api/collections/:id`
- `POST /api/collections/:id/cafes`
- `DELETE /api/collections/:id/cafes/:cafeId`
- `PUT /api/collections/:id/items/reorder`

Public endpoints:

- `GET /api/public/collections/:username/:slug`

## Client routes

- `/dashboard/collections`
- `/dashboard/collections/:slug`
- `/collections/:username/:slug`

## Notes

- Collection item creation enforces duplicate prevention per collection.
- Public collections only include published cafes.
- Private notes are stored with the collection item and never returned in public endpoints.
