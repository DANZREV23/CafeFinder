# SSL and Domain Configuration

This guide covers setting up your domain and SSL certificates for CafeFinder.

## 1. DNS Setup

Configure your domain's DNS settings at your registrar or DNS provider:

| Type | Host | Value |
|------|------|-------|
| A    | @    | YOUR_SERVER_IP |
| A    | www  | YOUR_SERVER_IP |

If using IPv6:
| Type | Host | Value |
|------|------|-------|
| AAAA | @    | YOUR_SERVER_IPV6 |
| AAAA | www  | YOUR_SERVER_IPV6 |

Verify DNS propagation:
```bash
dig yourdomain.com
nslookup yourdomain.com
```

## 2. SSL Setup with Certbot

We recommend using Let's Encrypt with Certbot for automated SSL management.

### Installation
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### Request Certificate
Ensure your Nginx configuration for port 80 is already active (see `PRODUCTION_DEPLOYMENT.md`).

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically:
1. Validate your domain control.
2. Generate the SSL certificates.
3. Update your Nginx configuration to enable HTTPS.
4. Configure HTTP to HTTPS redirection.

### Verify SSL
Test your Nginx configuration and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Auto-Renewal Test
Certbot includes a renewal timer. Verify it works:
```bash
sudo certbot renew --dry-run
```

## 3. Production Headers

Once SSL is stable, ensure the application is serving Strict-Transport-Security (HSTS) via the Nginx config:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```
