"""Lightweight checks that production files and branding assets are in place."""
from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase

from invoices.utils import _get_company_logo
from PathyCodeback.csv_export import branded_csv_response


ROOT = Path(settings.BASE_DIR)


class DeploymentArtifactTests(SimpleTestCase):
    def test_production_compose_and_nginx_exist(self):
        self.assertTrue((ROOT / 'docker-compose.prod.yml').is_file())
        self.assertTrue((ROOT / 'frontend' / 'Dockerfile').is_file())
        self.assertTrue((ROOT / 'deploy' / 'nginx' / 'default.conf').is_file())
        self.assertTrue((ROOT / 'DEPLOYMENT.md').is_file())
        self.assertTrue((ROOT / '.env.production.example').is_file())

    def test_prod_compose_passes_db_credentials_to_web(self):
        text = (ROOT / 'docker-compose.prod.yml').read_text(encoding='utf-8')
        self.assertIn('DB_PASSWORD: ${DB_PASSWORD:?', text)
        self.assertIn('DB_NAME: ${DB_NAME:-pathycode}', text)
        self.assertIn('DB_USER: ${DB_USER:-pathycode}', text)
        self.assertIn('DB_HOST: db', text)
        self.assertIn("DB_PORT: '5432'", text)
        self.assertIn('required: false', text)

    def test_postgres_credentials_helper_rejects_empty_password(self):
        from django.core.exceptions import ImproperlyConfigured
        from PathyCodeback.settings import _require_postgres_credentials

        with self.assertRaises(ImproperlyConfigured) as ctx:
            _require_postgres_credentials(
                'django.db.backends.postgresql',
                'pathycode',
                'pathycode',
                '',
            )
        self.assertIn('DB_PASSWORD', str(ctx.exception))

    def test_postgres_credentials_helper_allows_sqlite(self):
        from PathyCodeback.settings import _require_postgres_credentials

        _require_postgres_credentials(
            'django.db.backends.sqlite3',
            'db.sqlite3',
            '',
            '',
        )

    def test_production_env_example_has_required_keys(self):
        text = (ROOT / '.env.production.example').read_text(encoding='utf-8')
        for key in (
            'SECRET_KEY',
            'DEBUG',
            'ALLOWED_HOSTS',
            'FRONTEND_URL',
            'PROJECT_BASE_URL',
            'CSRF_TRUSTED_ORIGINS',
            'CORS_ALLOWED_ORIGINS',
            'DB_ENGINE',
            'DB_PASSWORD',
        ):
            self.assertIn(key, text)

    def test_whitenoise_is_enabled(self):
        self.assertIn('whitenoise.middleware.WhiteNoiseMiddleware', settings.MIDDLEWARE)
        self.assertIn(
            settings.STORAGES['staticfiles']['BACKEND'],
            {
                'django.contrib.staticfiles.storage.StaticFilesStorage',
                'whitenoise.storage.CompressedManifestStaticFilesStorage',
            },
        )

    def test_company_logo_resolves(self):
        logo = _get_company_logo()
        self.assertIsNotNone(logo)
        self.assertTrue(Path(logo).is_file())

    def test_branded_csv_response_headers(self):
        response, writer = branded_csv_response('clients.csv', 'Clients Export', 'Test')
        writer.writerow(['ID', 'Name'])
        self.assertEqual(response['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn('clients.csv', response['Content-Disposition'])
        body = response.content.decode('utf-8-sig')
        self.assertIn('Clients Export', body)
        self.assertIn('PathyCode', body)
