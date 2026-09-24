# Go-Live Checklist

Follow this checklist before and during the final production launch of CafeFinder.

## Pre-Launch Phase
- [ ] **DNS Verification**: Domain points to server IP (`dig yourdomain.com`).
- [ ] **Environment Variables**: All required variables in `.env` are set.
- [ ] **Database Backup**: Take a fresh backup of the existing database.
- [ ] **Uploads Backup**: Backup the existing `uploads/` directory.
- [ ] **Build Verification**: `npm run build` completes without errors.
- [ ] **SSL Certificates**: Certbot/SSL is ready for activation.

## Launch Phase
- [ ] **Build and Release**: Run production build and update symlinks.
- [ ] **Migrations**: Run `npx prisma migrate deploy` to apply production migrations.
- [ ] **Restart Service**: `sudo systemctl restart cafefinder`.
- [ ] **Nginx Activation**: Apply SSL and restart Nginx.
- [ ] **Firewall Verification**: Only ports 80, 443, and 22 (restricted) are open.

## Post-Launch Verification (Smoke Tests)
- [ ] **HTTPS Redirect**: `http://yourdomain.com` redirects to `https://`.
- [ ] **Homepage**: Loads correctly with all assets.
- [ ] **Health Endpoints**:
    - [ ] `/api/live` returns 200.
    - [ ] `/api/ready` returns 200 (database connected).
    - [ ] `/api/health` returns status "ok".
- [ ] **Authentication**:
    - [ ] Login works.
    - [ ] User session persists.
    - [ ] Logout works.
- [ ] **Core Features**:
    - [ ] Explore cafes.
    - [ ] Search and Filters.
    - [ ] Cafe Profile pages.
    - [ ] Owner Portal access.
    - [ ] Admin Portal access.
- [ ] **Uploads**:
    - [ ] Upload a cafe photo.
    - [ ] Image appears correctly in the UI.
- [ ] **PWA**:
    - [ ] Manifest loads.
    - [ ] Service worker registers.
    - [ ] App is installable.

## Monitoring and Maintenance
- [ ] **Logs**: Check `journalctl -u cafefinder -f` for errors.
- [ ] **SSL Renewal**: Verify `sudo certbot renew --dry-run`.
- [ ] **Backup Schedule**: Ensure cron jobs for backups are active.
