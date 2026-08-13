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
