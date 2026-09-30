# CafeFinder recommendations

## Status

Stage 36 uses a centralized, deterministic recommendation service. Results are based on published CafeFinder records and non-sensitive, first-party interaction data. Recommendations are not guaranteed and no external AI or recommendation provider is used.

## Signals

- Explicit user preferences: city, price range, amenities, coffee types, and vibes.
- Favorites, positively rated reviews, and recent cafe views for authenticated users.
- Cafe city, price range, normalized amenities, curated-list membership, rating, review count, featured state, and existing trending state.

Coffee-type and vibe preferences are stored for forward compatibility; the current cafe schema does not expose normalized fields for those categories, so they are not inferred from descriptions.

## Candidate rules and exclusions

- Only `CafeStatus.PUBLISHED` cafes are eligible.
- The current profile cafe, explicit exclusions, and cafes already favorited by the user are excluded from personalized discovery.
- Candidate queries are capped at 100 rows and user history is capped at 30 records. The returned limit is capped at 24.
- No GPS, sensitive characteristics, private messages, or cross-user data are used.

## Explanations

The API returns a public cafe summary plus a machine-readable reason: `FAVORITE_SIMILARITY`, `AMENITY_MATCH`, `CITY_MATCH`, `PRICE_MATCH`, `VIEW_SIMILARITY`, `PREFERENCE_MATCH`, `TRENDING`, `FEATURED`, `CURATED_LIST`, or `HIGH_RATING`. The frontend localizes these reasons; internal ranking scores are never returned.

## Diversity and determinism

Results use stable score, rating, review-count, and ID tie-breaking. The selection limits repeated city/price combinations when alternatives exist.

## Fallback and caching

Generic anonymous requests use a short-lived in-memory cache keyed by context and public query parameters. Personalized results are never cached globally. Empty or failed generation falls back to published featured, trending, and high-rated cafes. Cache entries are short-lived and the service checks publication status on generation.

## Privacy and retention

Preferences are private to the authenticated user and available only through `/api/users/me/preferences`. Resetting preferences does not delete favorites, reviews, or the account. Recent `UserCafeView` history is limited to 180 days in recommendation queries; maintenance cleanup should use `USER_VIEW_RETENTION_DAYS` with a default of 180 days.

## API

- `GET /api/recommendations/cafes?limit=8&context=home` — anonymous or authenticated.
- Optional query parameters: `excludeCafeId`, `cafeId`, `city`, and `amenity`.
- `GET /api/recommendations/diagnostics` — admin-only aggregate operational metrics.
- `GET /api/users/me/preferences` — authenticated user only.
- `PUT /api/users/me/preferences` — authenticated user only, validated and bounded.
- `DELETE /api/users/me/preferences` — authenticated user only; resets recommendation preferences.

## Diagnostics and testing

Diagnostics report request counts, anonymous/personalized request counts, fallback frequency, cache hits, and average generation duration without exposing individual preference profiles or behavior history. Validate with `npx prisma validate`, TypeScript checks, and the production build. A Prisma client regeneration may require stopping a process that is locking the Windows query-engine binary.

## Known limitations

- Coffee types and vibes are not normalized in the current schema and therefore are not used as inferred signals.
- The existing dashboard DTO remains cafe-summary based; the dedicated recommendation endpoint exposes explanations.
- Generic cache invalidation is TTL-based; deployments should clear process memory after publication or moderation changes.
