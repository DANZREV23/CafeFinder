# Performance Runbook

## Optimization Strategies

### Database Optimization
- **Indexes**: Periodically review `prisma/schema.prisma` and the `DATABASE_PERFORMANCE.md` for slow queries.
- **Connection Pooling**: Use a connection pooler (like PgBouncer) in high-traffic production environments.
- **Query Selection**: Avoid `SELECT *`. Use explicit `select` or `include` in Prisma.

### Frontend Performance
- **Code Splitting**: Admin and Owner dashboards are lazily loaded to reduce initial bundle size.
- **Asset Caching**: Hashed JS/CSS files are served with long-lived `Cache-Control` headers.
- **Image Optimization**: All user-uploaded images are processed via `sharp` to generate thumbnails and optimized versions.

### API Performance
- **Pagination**: All collection endpoints (Cafes, Reviews, Blogs) support `page` and `limit` parameters.
- **Rate Limiting**: Global and per-route rate limits prevent brute force and resource exhaustion.
- **Slow Request Detection**: Requests exceeding `SLOW_REQUEST_MS` (default 1000ms) are logged for review.

## Performance Budgets
- **Homepage Load**: < 1.5s (LCP).
- **Public API Response**: < 300ms (p95).
- **Search Autocomplete**: < 200ms.
- **Database Query**: < 100ms.

## Load Testing
To run a local load test:
1. Set `NODE_ENV=production`.
2. Use a tool like `autocannon` or `k6` against the target endpoints.
3. Monitor `/api/admin/system/status` during the test.
