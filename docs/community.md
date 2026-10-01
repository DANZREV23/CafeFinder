# Community features

CafeFinder keeps community engagement focused on cafe discovery and review quality rather than social-network-style activity.

## Review lifecycle

- Reviews are created as `PENDING` and are reviewed by moderators before becoming public.
- Valid state transitions are limited to safe, auditable changes.
- Approved reviews contribute to cafe aggregate ratings; pending, rejected, hidden, and removed reviews do not.

## Helpful reactions

- A user can mark a review as helpful once per review.
- Duplicate helpful reactions are prevented with a unique database constraint.
- Helpful counts are stored on the review record and updated atomically during creation and removal.

## Reporting

- Authenticated users may report a review with a supported reason and optional description.
- Duplicate reports by the same reporter for the same review are prevented.
- Reports are visible only to admins and are resolved with an audit trail.

## Owner responses

- Owners may respond only to reviews for their own cafes.
- Responses are subject to the same privacy and moderation controls as customer reviews.
- Responses are clearly distinct from the original customer review in public UI and API payloads.

## Privacy and moderation

- Only approved public review data is returned through public APIs.
- Private moderation notes and reporter identity remain private to admins.
- Moderation actions are logged for audit and tamper-resistant review history.
