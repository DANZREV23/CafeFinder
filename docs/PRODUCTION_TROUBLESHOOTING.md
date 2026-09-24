# Production Troubleshooting

Common issues and solutions for CafeFinder in production.

## 1. Application Not Starting

**Symptom:** `systemctl status cafefinder` shows "failed" or "restarting".

**Check Logs:**
```bash
journalctl -u cafefinder -n 100 -f
```

**Common Causes:**
- **Missing Env Vars**: Verify `/var/www/CafeFinder/shared/.env` contains all required variables.
- **Port Conflict**: Ensure another service isn't using the application port (default 3000).
- **Database Connection**: Verify PostgreSQL is running and credentials are correct.

## 2. Nginx 502 Bad Gateway

**Symptom:** Browser shows "502 Bad Gateway".

**Common Causes:**
- **App Down**: The Node.js application is not running. Check systemd status.
- **Wrong Proxy Port**: Nginx is trying to proxy to the wrong port. Check `/etc/nginx/sites-available/cafefinder`.

## 3. Database Connection Errors

**Symptom:** Logs show `PrismaClientInitializationError`.

**Troubleshooting:**
- Verify PostgreSQL is listening: `sudo ss -lntp | grep 5432`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
- Test connection manually: `psql -U user -d cafefinder -h localhost`

## 4. Permission Denied (Uploads)

**Symptom:** Users cannot upload images; logs show `EACCES`.

**Fix:**
Ensure the application user has write permissions to the shared uploads directory:
```bash
sudo chown -R sdn:sdn /var/www/CafeFinder/shared/uploads
sudo chmod -R 755 /var/www/CafeFinder/shared/uploads
```

## 5. SSL Issues

**Symptom:** Browser warns about insecure connection or "SSL_ERROR_SYSCALL".

**Check Nginx:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

**Certbot Status:**
```bash
sudo certbot certificates
```
