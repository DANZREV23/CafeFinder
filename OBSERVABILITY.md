# Observability in CafeFinder

## Standardized Logging

CafeFinder uses a structured logging approach to ensure logs are consistent, searchable, and informative.

### Log Format
In production, logs are output as structured JSON. In development, logs are pretty-printed for readability.

### Fields
- `timestamp`: ISO8601 timestamp.
- `level`: `DEBUG`, `INFO`, `WARN`, `ERROR`.
- `requestId`: Unique correlation ID for the request (via `X-Request-ID` header).
- `userId`: ID of the authenticated user, if available.
- `role`: Role of the authenticated user.
- `method`: HTTP method.
- `route`: Original URL.
- `normalizedRoute`: Grouped route pattern (e.g., `/api/cafes/:slug`).
- `statusCode`: HTTP response code.
- `durationMs`: Response time in milliseconds.
- `event`: Logical event name (e.g., `http.request`, `auth.login`).
- `errorCode`: Standardized error code (e.g., `VALIDATION_ERROR`).

## Performance Monitoring

### Slow Request Detection
Requests exceeding 1000ms (configurable via `SLOW_REQUEST_MS`) are automatically logged as warnings with the `performance.slow_request` event.

### Metrics Aggregation
The `MetricsService` maintains in-memory counters for:
- Request counts per normalized route.
- 4xx and 5xx error rates.
- Average response times.
- Slow request counts.

These metrics are exposed to administrators via the `/admin/system` dashboard.

## Error Tracking

### Standardized Codes
The application uses the following error codes for consistent client-side handling:
- `VALIDATION_ERROR`: Input failed validation.
- `UNAUTHORIZED`: Authentication required.
- `FORBIDDEN`: Insufficient permissions.
- `NOT_FOUND`: Resource missing.
- `CONFLICT`: Unique constraint violation.
- `RATE_LIMITED`: Too many requests.
- `DATABASE_ERROR`: Unexpected database failure.
- `MAINTENANCE_MODE`: System is undergoing maintenance.
- `INTERNAL_SERVER_ERROR`: Generic server error.

## Operational Diagnostics

Diagnostics are available via:
- `/api/health`: Standard health check for load balancers.
- `/api/admin/system/status`: Detailed system telemetry for admins.
- `/logs/app.log`: Persistent log file.
