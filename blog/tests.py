from django.test import TestCase

# Create your tests here.

from django.test import TestCase
from .models import BlogPost

class BlogPostTest(TestCase):
    """
    Unit test for the BlogPost model.
    Ensures that blog posts can be created and queried correctly.
    """

    def setUp(self):
        """
        Set up a sample blog post for testing.
        This method is called before each test function.
        """
        BlogPost.objects.create(
            title="Django Tips",
            body="Use Class-Based Views for scalability.",
            category="Django",
            tags="django,cbv,tips"
        )

    def test_blog_post_creation(self):
        """
        Test that the blog post was created and contains the expected content.
        """
        post = BlogPost.objects.get(title="Django Tips")
        self.assertEqual(post.category, "Django")
        self.assertIn("scalability", post.body)
    def test_get_tags_list(self):
        """
        Test that the tags list is returned correctly.
        """
        post = BlogPost.objects.get(title="Django Tips")
        self.assertEqual(post.get_tags_list(), ["django", "cbv", "tips"])