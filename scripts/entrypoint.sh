#!/bin/sh
set -e

# Fail before migrate when PostgreSQL credentials were not injected (common on
# Elastic Beanstalk if Compose does not pass DB_* into the web container).
# Do not print secret values.
case "${DB_ENGINE:-}" in
  *postgresql*)
    missing=""
    [ -z "${DB_NAME:-}" ] && missing="$missing DB_NAME"
    [ -z "${DB_USER:-}" ] && missing="$missing DB_USER"
    [ -z "${DB_PASSWORD:-}" ] && missing="$missing DB_PASSWORD"
    if [ -n "$missing" ]; then
      echo "ERROR: PostgreSQL requires$missing." >&2
      echo "Set them in .env (local) or Elastic Beanstalk environment properties." >&2
      echo "docker-compose.prod.yml must pass DB_NAME, DB_USER, and DB_PASSWORD into web." >&2
      exit 1
    fi
    ;;
esac

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "${DEBUG:-True}" = "False" ] || [ "${DEBUG:-true}" = "false" ]; then
  python scripts/check_deploy.py
fi

exec gunicorn PathyCodeback.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
