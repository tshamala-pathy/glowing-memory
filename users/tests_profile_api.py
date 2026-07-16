from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from django.test import TestCase
from PIL import Image

User = get_user_model()


def make_test_image(filename='avatar.jpg', fmt='JPEG'):
    buf = BytesIO()
    Image.new('RGB', (8, 8), color=(70, 130, 180)).save(buf, format=fmt)
    buf.seek(0)
    content_type = 'image/jpeg' if fmt == 'JPEG' else f'image/{fmt.lower()}'
    return SimpleUploadedFile(filename, buf.read(), content_type=content_type)


class ProfileUpdateAPITest(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password',
            first_name='Admin',
            last_name='User',
        )
        self.api.force_authenticate(user=self.admin)

    def test_superuser_can_update_name(self):
        response = self.api.patch(
            reverse('profile_update'),
            {'first_name': 'Pathy', 'last_name': 'Code'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['first_name'], 'Pathy')
        self.assertEqual(response.data['last_name'], 'Code')
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.first_name, 'Pathy')

    def test_superuser_can_upload_avatar(self):
        avatar = make_test_image()
        response = self.api.patch(
            reverse('profile_update'),
            {'avatar': avatar},
            format='multipart',
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data.get('avatar') or response.data.get('avatar_url'))
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.avatar)
