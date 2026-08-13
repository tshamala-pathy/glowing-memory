#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "${DEBUG:-True}" = "False" ] || [ "${DEBUG:-true}" = "false" ]; then
  python scripts/check_deploy.py
fi

exec gunicorn PathyCodeback.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
