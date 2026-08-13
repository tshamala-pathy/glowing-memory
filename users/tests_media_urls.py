"""Tests for media URL helpers used by messaging and profile serializers."""
from django.test import SimpleTestCase, override_settings

from users.media_urls import absolute_url_path


class AbsoluteUrlPathTests(SimpleTestCase):
    def test_empty_path_returns_none(self):
        self.assertIsNone(absolute_url_path(None, None))
        self.assertIsNone(absolute_url_path(None, ''))

    def test_keeps_absolute_http_urls(self):
        url = 'https://cdn.example.com/media/a.png'
        self.assertEqual(absolute_url_path(None, url), url)

    @override_settings(PROJECT_BASE_URL='https://pathycode.example')
    def test_prefixes_relative_paths_without_request(self):
        self.assertEqual(
            absolute_url_path(None, 'media/a.png'),
            'https://pathycode.example/media/a.png',
        )
        self.assertEqual(
            absolute_url_path(None, '/media/a.png'),
            'https://pathycode.example/media/a.png',
        )
