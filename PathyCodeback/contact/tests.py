from django.test import TestCase

# Create your tests here.
from django.test import TestCase
from .models import ContactMessage

class ContactMessageTest(TestCase):
    """
    ✅ Unit tests for the ContactMessage model.
    Ensures correct creation and attribute handling.
    """

    def test_create_message(self):
        """
        🧪 Test that a ContactMessage instance is created correctly
        and the 'subject' field retains the expected value.
        """
        msg = ContactMessage.objects.create(
            name="Pathy Fan",
            email="fan@example.com",
            subject="Project Inquiry",
            message="Hey! I love your work. Can we collaborate?"
        )
        self.assertEqual(msg.subject, "Project Inquiry")
    def test_string_representation(self):
        """
        🧪 Test the string representation of a ContactMessage instance.
        """
        msg = ContactMessage(
            name="Pathy Fan",
            email="fan@example.com",
            subject="Project Inquiry",
            message="Hey! I love your work. Can we collaborate?"
        )
        self.assertEqual(str(msg), "Pathy Fan - Project Inquiry")