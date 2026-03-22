from django.test import TestCase
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

class CustomUserModelTest(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='pathydev',
            email='pathy@example.com',
            password='securepassword123',
            bio='Junior Software Engineer from Cape Town'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.username, 'pathydev')
        self.assertEqual(self.user.email, 'pathy@example.com')
        self.assertTrue(self.user.check_password('securepassword123'))
        self.assertEqual(self.user.bio, 'Junior Software Engineer from Cape Town')

    def test_user_str(self):
        self.assertEqual(str(self.user), 'pathydev')

    def test_email_is_unique(self):
        with self.assertRaises(Exception):  # IntegrityError or ValidationError depending on setup
            CustomUser.objects.create_user(
                username='duplicate',
                email='pathy@example.com',  # Same email
                password='anotherpassword'
            )
    def test_username_is_unique(self):
        with self.assertRaises(Exception):  # IntegrityError or ValidationError depending on setup
            CustomUser.objects.create_user(
                username='pathydev',  # Same username
                email='another@example.com',
                password='anotherpassword'
            )