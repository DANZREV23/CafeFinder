# User Data Export & Portability

In compliance with data privacy standards, CafeFinder provides users with the ability to export their personal data in a structured format.

## 1. Export Content

The export includes:
- **Profile Information**: Name, Email, Role, Joined Date.
- **Activity History**: Recent activity logs.
- **Content**:
  - Reviews submitted (ratings and comments).
  - Cafe submissions.
  - Ownership claims.
- **Preferences**:
  - Favorite cafes.
  - Notification history.

## 2. Technical Implementation

The export is handled by `UserDataExportService`.

- **Format**: JSON (Structured and Machine-readable).
- **Access**: Available via the User Profile/Security settings page.
- **Authentication**: Requires a valid session with a confirmed email.

## 3. Account Deactivation

Users can deactivate their accounts at any time.

- **Effect**: Login is disabled, public profile is hidden.
- **Data Preservation**: User data is preserved for 30 days in case of accidental deactivation, after which it is marked for permanent archival.
- **Reviews**: Historical reviews remain but are marked as "Deleted User" to preserve cafe rating integrity unless explicitly requested for removal.

## 4. Administrative Export

Administrators can trigger a system-wide data dump for auditing purposes via the `BackupService`, which includes the full database state.
