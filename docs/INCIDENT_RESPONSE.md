# Incident Response Runbook

## Workflow

1. **Detect**: Alert fires or user report received.
2. **Confirm**: Verify the issue via health check endpoints.
3. **Assess Impact**: Identify which users and features are affected.
4. **Preserve Logs**: Snapshot current logs before restarting services.
5. **Stabilize**:
    - If a recent deployment caused it: `npm run rollback`.
    - If database issue: Restart DB service or scale connections.
    - If disk issue: Clear old logs/backups.
6. **Remediate**: Fix the root cause in the code or infrastructure.
7. **Verify**: Run `npm run test:smoke` to ensure stability.
8. **Document**: Record the incident in an Internal Post-Mortem.

## Common Scenarios

### Application Returns 502/503
- **Cause**: Node.js process crashed or Nginx cannot reach the upstream.
- **Action**: Check systemd status: `systemctl status cafefinder`. Restart if necessary.

### Database Corruption / Data Loss
- **Cause**: Accidental deletion or hardware failure.
- **Action**: Locate last successful backup in `/backups`. Follow `BACKUP_VERIFICATION.md` for restore procedure.

### High Error Rate (4xx/5xx)
- **Cause**: Bad deployment, API breaking change, or external dependency failure.
- **Action**: Check Performance dashboard. Revert to previous stable version if necessary.
