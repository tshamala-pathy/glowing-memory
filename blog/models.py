from django.db import models

class BlogPost(models.Model):
    """
    Represents a blog post in the application.

    This model stores data for a blog article, including title, body content, category,
    comma-separated tags, and the timestamp of creation. Useful for blogs, news sections,
    or content feeds within a Django application.
    """

    title = models.CharField(
        max_length=255,
        help_text="The title of the blog post."
    )
    body = models.TextField(
        help_text="The main content of the blog post."
    )
    category = models.CharField(
        max_length=100,
        help_text="The category the blog post belongs to, e.g., Tech, Lifestyle."
    )
    tags = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated tags to help categorize or search blog posts."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The timestamp when the post was created."
    )

    def __str__(self) -> str:
        """
        Returns a human-readable string representation of the blog post,
        which is its title.
        """
        return self.title

    class Meta:
        """
        Meta configuration for the BlogPost model.
        """
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
        ordering = ['-created_at']
    def get_tags_list(self):
        """
        Returns a list of tags associated with the blog post.
        """
        return [tag.strip() for tag in self.tags.split(',')] if self.tags else []
    