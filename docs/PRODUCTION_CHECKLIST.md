# CafeFinder Production Checklist

Use this checklist to verify that the application is ready for production use.

## Application & Environment
- [ ] `NODE_ENV` is set to `production`.
- [ ] `npm run build` completed successfully without errors.
- [ ] `PORT` is correctly configured (default 3000).
- [ ] `CLIENT_URL` is set to the production domain.
- [ ] All required secrets are configured in `.env` (not committed to Git).
- [ ] Node.js version is v20+.

## Database
- [ ] PostgreSQL instance is reachable from the application server.
- [ ] `PRISMA_DATABASE_URL` uses a secure password.
- [ ] `npx prisma migrate deploy` has been run.
- [ ] Database backup system is enabled (`BACKUP_ENABLED=true`).
- [ ] `npm run backup:db` successful and verified.
- [ ] `npm run db:restore-test` successful.

## Security
- [ ] HTTPS is enabled via reverse proxy or load balancer.
- [ ] `COOKIE_SECRET` is a long, random string.
- [ ] CSRF and CORS protections are enabled and configured for the production domain.
- [ ] Rate limits are active.
- [ ] Sensitive headers (X-Powered-By, etc.) are removed (Helmet).
- [ ] Admin routes are restricted and tested.

## Files & Storage
- [ ] `uploads/` directory is writable by the application user.
- [ ] `UPLOAD_BACKUP_ENABLED=true`.
- [ ] Disk space is being monitored.
- [ ] `MAX_FILE_SIZE` limits are enforced for uploads.

## Monitoring & Logs
- [ ] `/api/live` returns 200 OK.
- [ ] `/api/ready` returns 200 OK.
- [ ] `/api/health` returns valid status (Admin only).
- [ ] Application logs are writing to `logs/app.log`.
- [ ] Log rotation is configured.
- [ ] Request IDs are appearing in logs.

## Email
- [ ] `EMAIL_ENABLED=true`.
- [ ] `EMAIL_PROVIDER` is set to `smtp` or a supported provider.
- [ ] Test email sent successfully from the production server.
- [ ] Failure and retry logic verified.

## PWA & SEO
- [ ] Service worker is active in production build.
- [ ] `robots.txt` and `sitemap.xml` are accessible.
- [ ] OpenGraph and Meta tags are correctly rendered.

## Disaster Recovery
- [ ] `docs/DISASTER_RECOVERY.md` reviewed by operations team.
- [ ] Backup retention policy verified.
- [ ] Rollback procedure tested.
- [ ] Contact list for infrastructure providers is available.
