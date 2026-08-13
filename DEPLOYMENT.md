# Deployment Guide

Production deployment for PathyCode: **PostgreSQL**, **Django/Gunicorn**, **React** (nginx), and optional **HTTPS** at the edge.

## Architecture

```
Browser → nginx:80
            ├── /              React SPA (static build)
            ├── /api/*         → web:8000 (Gunicorn)
            ├── /admin/*       → web:8000
            ├── /payments/*    → web:8000 (PayFast ITN)
            ├── /static/*      → web:8000 (WhiteNoise)
            └── /media/*       → shared volume (user uploads)
          web → db:5432 (PostgreSQL)
```

## Quick deploy (Docker Compose)

### 1. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env`:

| Variable | Notes |
|----------|--------|
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `DEBUG` | Must be `False` |
| `ALLOWED_HOSTS` | Your domain(s), comma-separated |
| `FRONTEND_URL` / `PROJECT_BASE_URL` | Public `https://yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` / `CORS_ALLOWED_ORIGINS` | Same public URL(s) with scheme |
| `DB_PASSWORD` | Strong PostgreSQL password |
| `PAYFAST_*` | Production merchant credentials; `PAYFAST_NOTIFY_URL` must be publicly reachable |

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Create admin user

```bash
docker compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
```

### 4. Verify

- Site: `http://localhost` (or your domain)
- Health: `http://localhost/api/health/`
- Django admin: `http://localhost/admin/`

Grant Financial Dashboard access in Django Admin (**Users → Permissions → Can view financial dashboard**) or set `FINANCIAL_DASHBOARD_ALLOWED_EMAILS` in `.env`.

## Pre-flight check (local)

With production-like env vars loaded:

```bash
pip install -r requirements.txt
python scripts/check_deploy.py
python manage.py check --deploy
```

## HTTPS

Terminate TLS at nginx or a load balancer (recommended):

1. Set `USE_TLS=True` in `.env`
2. Set `SECURE_SSL_REDIRECT=False` when TLS terminates at nginx (avoid redirect loops)
3. Ensure nginx sends `X-Forwarded-Proto: https`
4. Point `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` to `https://…`

Add an SSL server block or use a reverse proxy (Caddy, Traefik, cloud LB) in front of the `nginx` service.

## PayFast

PayFast **ITN** (`POST /payments/notify/`) must reach your server from the public internet. Set:

```env
PAYFAST_NOTIFY_URL=https://yourdomain.com/payments/notify/
PROJECT_BASE_URL=https://yourdomain.com
```

Use production PayFast credentials and passphrase for signature verification.

## Backend-only deploy

The root `Dockerfile` + `docker-compose.yml` run API only (port 8000). Host the React build separately (Vercel, Netlify, S3+CloudFront) and set:

```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

Build the frontend with that variable:

```bash
cd frontend
REACT_APP_BACKEND_URL=https://api.yourdomain.com npm run build
```

## Static and media files

- **Static** (Django admin, etc.): collected to `staticfiles/` via `collectstatic`; served by WhiteNoise through Gunicorn.
- **Media** (uploads): stored in `/app/media` (Docker volume `media_data`); nginx serves `/media/` from the shared volume.

Back up `postgres_data` and `media_data` volumes regularly.

## Environment reference

See `.env.example` (development) and `.env.production.example` (production template).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs backend tests, frontend build, and `docker build` on push/PR to `main`/`master`.

## Manual checklist

- [ ] `DEBUG=False`
- [ ] Strong `SECRET_KEY` and `DB_PASSWORD`
- [ ] PostgreSQL (not SQLite)
- [ ] `ALLOWED_HOSTS`, CSRF, and CORS configured
- [ ] HTTPS enabled at the edge
- [ ] PayFast notify URL publicly reachable
- [ ] SMTP email configured
- [ ] Database and media backups scheduled
- [ ] Financial dashboard grants assigned to authorized staff
