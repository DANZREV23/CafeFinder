# Data Lifecycle Policy

This document outlines the lifecycle states, transitions, and retention policies for major entities within the CafeFinder platform.

## 1. Cafe Lifecycle

| State | Description |
| :--- | :--- |
| `DRAFT` | Initial state. Not visible to the public. |
| `PENDING_REVIEW` | Submitted for moderation. Not visible to the public. |
| `PUBLISHED` | Active and visible to all users. |
| `REJECTED` | Submission or claim denied. Not visible to the public. |
| `SUSPENDED` | Temporarily hidden due to moderation issues. |
| `ARCHIVED` | Permanently closed or removed from discovery but historical data preserved. |

### Valid Transitions
- `DRAFT` → `PENDING_REVIEW`
- `PENDING_REVIEW` → `PUBLISHED` | `REJECTED`
- `PUBLISHED` → `SUSPENDED` | `ARCHIVED`
- `SUSPENDED` → `PUBLISHED` | `ARCHIVED`

## 2. User Lifecycle

| State | Description |
| :--- | :--- |
| `ACTIVE` | Normal account status. Full access. |
| `INACTIVE` | Self-deactivated. Login disabled, but data preserved. |
| `SUSPENDED` | Administrative ban. Access denied. |

## 3. Review Lifecycle

| State | Description |
| :--- | :--- |
| `PENDING` | Awaiting moderation. |
| `APPROVED` | Visible on cafe profiles. |
| `REJECTED` | Hidden from public. |
| `HIDDEN` | Manually hidden by admin or owner request. |

## 4. Retention Policies

| Entity | Retention Period | Action |
| :--- | :--- | :--- |
| `Sessions` | Until Expiry | Deleted automatically |
| `Notifications` | 30 Days (Read) | Deleted automatically |
| `Email Jobs` | 7 Days (Sent/Failed) | Deleted automatically |
| `Activity Logs` | 90 Days | Deleted automatically (Batched) |
| `Analytics` | 180 Days | Deleted automatically (Batched) |

## 5. Deletion Behavior

CafeFinder prefers **Soft Deletion** and **Archiving** over physical deletion to maintain data integrity and historical audit trails. Physical deletion is only used for transient data like sessions or logs after their retention period expires.
