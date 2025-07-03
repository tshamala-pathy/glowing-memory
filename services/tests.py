from django.test import TestCase
from .models import Service

# ✅ Unit tests for the Service model
class ServiceModelTest(TestCase):
    """
    Test case for the Service model.
    This class ensures that service instances are created and behave as expected.
    """

    def setUp(self):
        """
        Set up a test Service object before each test is run.
        """
        Service.objects.create(
            title="Web Development",
            description="Building responsive, full-stack websites.",
            icon="fas fa-code"
        )

    def test_service_created(self):
        """
        Test if the Service object is created with the correct description.
        """
        service = Service.objects.get(title="Web Development")
        self.assertEqual(service.description, "Building responsive, full-stack websites.")

    def test_service_icon(self):
        """
        Test if the Service object has the correct icon value.
        """
        service = Service.objects.get(title="Web Development")
        self.assertEqual(service.icon, "fas fa-code")
    def test_service_str(self):
        """
        Test the string representation of the Service object.
        """
        service = Service.objects.get(title="Web Development")
        self.assertEqual(str(service), "Web Development")