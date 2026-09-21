# Data Integrity Strategy

This document describes the mechanisms used to ensure data consistency, quality, and reliability across the CafeFinder system.

## 1. Automated Checks

The system performs periodic integrity scans via the `DataIntegrityService`. Key checks include:

- **Rating Synchronization**: Ensures `ratingAverage` and `reviewCount` on `Cafe` match the actual `CafeReview` records.
- **Orphaned Entities**: Identifies reviews, claims, or change requests that refer to non-existent cafes or users.
- **Media Consistency**: Verifies that database `CafeMedia` records have corresponding files on disk.
- **Status Validation**: Ensures entities are not in unreachable or invalid states.

## 2. Repair Operations

Repair operations must be explicitly triggered by an authorized administrator via the Admin Dashboard.

### Recalculate Ratings
Recalculates the `ratingAverage` for a specific cafe based on all its `APPROVED` reviews. This fixes drift caused by rare concurrency issues.

### Repair Orphaned Reviews
Identifies reviews without valid Cafe or User parents and soft-deletes/hides them to prevent UI crashes.

### Session Cleanup
Removes expired session records from the database to maintain performance.

## 3. Duplicate Detection

The `CafeDuplicateService` uses a string normalization algorithm to identify potential business duplicates.

- **Normalization**: Lowercase, remove special characters, remove common business suffixes (Inc, Ltd).
- **Matching criteria**:
  - Exact Name + City match.
  - Near Address match.
  - Contact Info match (Phone/Email).

Duplicates are flagged for manual review rather than automatic merging to prevent accidental data loss.

## 4. Maintenance Best Practices

1. **Audit Logs**: All repair actions must be logged.
2. **Backups**: Run a full database backup before large-scale repair operations.
3. **Staging**: Test complex repairs in a staging environment first.
4. **Transparency**: Notify affected cafe owners if significant historical data is modified during a repair.
