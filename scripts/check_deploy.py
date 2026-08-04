#!/usr/bin/env python
"""
Pre-deployment readiness check.

Runs Django's ``check --deploy`` and validates required environment variables
when ``DEBUG=False``.

Usage (from repo root):
    python scripts/check_deploy.py
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PathyCodeback.settings')

import django  # noqa: E402

django.setup()

from decouple import config  # noqa: E402


REQUIRED_WHEN_PRODUCTION = (
    'SECRET_KEY',
    'ALLOWED_HOSTS',
    'FRONTEND_URL',
    'PROJECT_BASE_URL',
    'CSRF_TRUSTED_ORIGINS',
    'CORS_ALLOWED_ORIGINS',
)


def main():
    errors = []
    debug = config('DEBUG', default=True, cast=bool)

    if debug:
        print('WARNING: DEBUG=True — not production-ready.')
    else:
        for name in REQUIRED_WHEN_PRODUCTION:
            value = config(name, default='')
            if not str(value).strip():
                errors.append(f'Missing or empty env var: {name}')

        secret = config('SECRET_KEY', default='')
        if secret.startswith('django-insecure') or secret == 'change-me-to-a-long-random-string':
            errors.append('SECRET_KEY is still a placeholder — generate a strong secret.')

        if config('DB_ENGINE', default='').endswith('sqlite3'):
            errors.append('DB_ENGINE is SQLite — use PostgreSQL in production.')

    if not debug:
        print('Running Django deploy checks...')
        result = subprocess.run(
            [sys.executable, 'manage.py', 'check', '--deploy'],
            cwd=ROOT,
        )
        if result.returncode:
            errors.append('Django check --deploy reported issues (see output above).')
    else:
        print('Skipping Django check --deploy (DEBUG=True).')

    if errors:
        print('\nDeployment check FAILED:')
        for item in errors:
            print(f'  - {item}')
        return 1

    print('\nDeployment check passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
