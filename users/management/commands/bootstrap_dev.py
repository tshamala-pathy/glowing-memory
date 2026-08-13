"""
Create a local superuser when the database has no accounts.

Usage:
    python manage.py bootstrap_dev
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

DEFAULT_USERNAME = 'admin'
DEFAULT_EMAIL = 'admin@pathycode.local'
DEFAULT_PASSWORD = 'Admin123!'


class Command(BaseCommand):
    help = 'Create a development superuser when no users exist (local setup only).'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Create another superuser even if users exist.')

    def handle(self, *args, **options):
        user_model = get_user_model()
        if user_model.objects.exists() and not options['force']:
            count = user_model.objects.count()
            self.stdout.write(self.style.WARNING(f'Database already has {count} user(s). Nothing to do.'))
            return

        if user_model.objects.filter(username=DEFAULT_USERNAME).exists():
            self.stdout.write(self.style.WARNING(f'User "{DEFAULT_USERNAME}" already exists.'))
            return

        user_model.objects.create_superuser(
            username=DEFAULT_USERNAME,
            email=DEFAULT_EMAIL,
            password=DEFAULT_PASSWORD,
        )
        self.stdout.write(self.style.SUCCESS(
            f'Created superuser:\n'
            f'  username: {DEFAULT_USERNAME}\n'
            f'  password: {DEFAULT_PASSWORD}\n'
            f'Log in at /login, then open /admin/users.'
        ))
