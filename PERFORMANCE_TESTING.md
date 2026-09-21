# Performance Testing Guide

## Backend Performance Testing

### Tools
- **Artillery**: Recommended for load testing API endpoints.
- **k6**: Excellent for scriptable performance testing.

### Scenarios
1. **Explore Search**: Test `/api/cafes` with various filters and search queries.
2. **Cafe Profile**: Test `/api/cafes/:slug` to measure complex include performance.
3. **Admin Dashboard**: Test `/api/admin/dashboard` for heavy aggregation performance.

### Baselines
- **P95 Latency**: Should be < 200ms for simple reads.
- **P95 Latency**: Should be < 500ms for complex profiles.
- **Error Rate**: Should be < 0.1% under normal load.

## Frontend Performance Testing

### Lighthouse Audit
Run Lighthouse in Chrome DevTools on:
- Homepage
- Explore Page
- Cafe Profile

Target Scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s.
- **FID (First Input Delay)**: < 100ms.
- **CLS (Cumulative Layout Shift)**: < 0.1.

## Continuous Monitoring
Check `/api/admin/system/status` periodically to monitor:
- Memory usage trends.
- Database latency spikes.
- Slow request warnings in logs.
