# Emergency Rollback Procedure

In the event of a failed production release, follow these steps to restore service.

## 1. Application Rollback

If the new application code is buggy or fails to start:

1. Identify the previous known-good release directory in `/var/www/CafeFinder/releases/`.
2. Update the `current` symlink to point to the previous release:
   ```bash
   ln -sfn /var/www/CafeFinder/releases/<PREVIOUS_VERSION> /var/www/CafeFinder/current
   ```
3. Restart the service:
   ```bash
   sudo systemctl restart cafefinder
   ```
4. Verify health:
   ```bash
   curl https://yourdomain.com/api/health
   ```

## 2. Database Rollback

**Warning:** Database rollback should be a last resort, as it can cause data loss for any records created between the bad release and the rollback.

1. If the previous application is NOT compatible with the new schema:
   - Identify the latest database backup.
   - Restore the backup:
     ```bash
     psql -U user -d cafefinder < backup.sql
     ```
2. If the previous application IS compatible with the new schema:
   - Only rollback the application code.

## 3. Post-Rollback Steps

1. Preserve logs from the failed release for debugging:
   ```bash
   journalctl -u cafefinder --since "1 hour ago" > failed-release.log
   ```
2. Identify the root cause before attempting a new release.
3. Notify the team about the incident and the successful rollback.
