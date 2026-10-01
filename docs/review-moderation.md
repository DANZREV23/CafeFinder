# Review moderation

The review moderation flow protects cafe quality and community trust while keeping workflow focused and bounded.

## Moderation states

The system supports the following review states:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `HIDDEN`
- `REMOVED`

Transitions are validated so that arbitrary state jumps are rejected. Typical transitions include:

- `PENDING -> APPROVED`
- `PENDING -> REJECTED`
- `APPROVED -> HIDDEN`
- `HIDDEN -> APPROVED`
- `APPROVED -> REMOVED`

## Report moderation

Admins can filter, paginate, and resolve review reports. Report resolution is recorded with the action taken and notes. Reports are not exposed publicly.

## Photo moderation

Review photos remain tied to their parent review and can be moderated without deleting the review itself. Photo safety checks and ownership checks remain enforced before upload or deletion.

## Rate limiting and abuse handling

Review creation, editing, helpful reactions, report submission, and owner responses are subject to existing security and rate-limit protections. Duplicate submissions are prevented with database constraints and explicit service checks.

## Rating aggregates

Cafe rating totals are recalculated only from approved reviews. Review status changes that affect public visibility trigger aggregate recalculation in the transaction flow.
