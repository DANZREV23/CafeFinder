# Database Performance Optimization

## Indexing Strategy

CafeFinder uses strategic indexing on frequently queried columns and foreign keys to ensure fast lookups and joins.

### Key Indexes
- `users`: `email` (unique).
- `cafes`: `status`, `city`, `featured`, `trending`, `ratingAverage`, `createdAt`, `ownerId`.
- `sessions`: `userId`, `expiresAt`, `tokenHash` (unique).
- `cafe_reviews`: `cafeId`, `userId`, `status`.
- `cafe_favorites`: `userId`, `cafeId`, `createdAt`.
- `cafe_photos`: `cafeId`.
- `activity_logs`: `userId`, `entityType`, `entityId`, `createdAt`.
- `email_jobs`: `status`, `availableAt`, `createdAt`.

## Query Optimization

### Prisma Selects & DTOs
To reduce data transfer, queries should use the `select` or `include` carefully.
- Avoid fetching entire `User` objects when only basic info is needed.
- Use `take` and `skip` for pagination on all list endpoints.

### Avoiding N+1 Issues
- Use Prisma's `include` to fetch related data in a single batch query.
- For complex related data, use the `prisma-nested-include` pattern or dedicated batching services.

## Maintenance
- Regularly monitor Prisma query logs (enabled via `PRISMA_LOG_QUERIES=true`).
- Review `OperationalService` metrics for slow database queries.
- Periodic cleanup of expired sessions and old activity logs via `system:cleanup`.
