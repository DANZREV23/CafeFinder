# Dependency Update Runbook

## Policy
- **Critical Security Patches**: Apply within 48 hours of detection.
- **Minor/Patch Updates**: Review and apply monthly.
- **Major Updates**: Evaluate quarterly for breaking changes and benefits.

## Procedure
1. Create a new branch: `git checkout -b update/dependencies`.
2. Run `npm outdated` to see what is stale.
3. Update specific packages: `npm install [package]@latest`.
4. Run full test suite: `npm test`.
5. Run smoke tests: `npm run test:smoke`.
6. Audit for security issues: `npm audit`.
7. Verify Prisma compatibility: `npx prisma generate`.
8. Deploy to staging/verification environment.
9. Deploy to production after verification.

## Rollback Plan
If an update causes issues in production:
1. Revert the commit in the main branch.
2. Re-deploy the previous stable build.
3. Investigate the failure in a local environment.
