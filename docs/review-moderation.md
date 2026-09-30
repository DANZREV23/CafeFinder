# Review moderation

## Lifecycle

Reviews use `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`, and `REMOVED`. Public lists include approved reviews only. Moderation actions are authorized server-side, validate the current record, recalculate aggregates when applicable, and write an activity log.

## Reports

Authenticated users may submit one private report per review while the previous report is pending. Administrators can inspect the paginated `/admin/review-reports` queue, dismiss a report, or hide the reported review. Reporter identity and description are never returned by public review APIs.

## Helpful reactions

`ReviewHelpful` has a unique `(reviewId, userId)` constraint. Toggling is idempotent at the database level and public APIs expose only the aggregate count.

## Owner responses

Responses are tied to the review, café, and owner. Ownership is checked on the server before creation. Responses are stored pending moderation and only approved responses are rendered publicly.

## Privacy, uploads, and retention

Review photos remain subject to the existing upload pipeline and ownership checks. No private moderation notes, contact information, sessions, IP addresses, or report data are included in public DTOs. Existing cleanup and backup jobs remain responsible for retention and media checks.

## Performance and abuse controls

Review pages are capped and paginated. Sorting and photo filtering occur in the database. Existing rate limits protect review creation and reporting; unique database constraints protect duplicate reviews, reports, and helpful reactions.
