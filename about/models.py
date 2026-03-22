from django.db import models

class AboutUs(models.Model):
    """
    Model for About Us page content.
    Only one instance should exist (singleton pattern).
    """
    title = models.CharField(max_length=255, default='About Us')
    hero_title = models.CharField(max_length=255, default='About PathyCode')
    hero_subtitle = models.TextField(
        default='We are passionate about creating innovative solutions and delivering exceptional results.',
        help_text="Subtitle text for the hero section"
    )
    our_story_title = models.CharField(max_length=255, default='Our Story')
    our_story_content = models.TextField(
        default='PathyCode was founded with a vision to empower businesses and individuals through cutting-edge technology solutions.',
        help_text="Main story content"
    )
    mission_title = models.CharField(max_length=255, default='Our Mission')
    mission_content = models.TextField(
        default='To deliver innovative, high-quality solutions that drive success for our clients.',
        help_text="Mission statement"
    )
    vision_title = models.CharField(max_length=255, default='Our Vision')
    vision_content = models.TextField(
        default='To be a leading force in technology innovation, recognized for excellence and impact.',
        help_text="Vision statement"
    )
    why_choose_us_title = models.CharField(max_length=255, default='Why Choose Us')
    why_choose_us_content = models.TextField(
        default='We combine expertise, innovation, and dedication to deliver exceptional results.',
        help_text="Why choose us content"
    )
    image = models.ImageField(upload_to='about/', blank=True, null=True, help_text="Main about us image")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "About Us"
        verbose_name_plural = "About Us"
        ordering = ['-updated_at']

    def __str__(self):
        return self.title

class Solution(models.Model):
    """
    Model for problems we solve / solutions we offer. Displayed on About Us page.
    """
    about_us = models.ForeignKey(AboutUs, related_name='solutions', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="How we solve this problem / what we deliver")
    icon = models.CharField(max_length=100, blank=True, help_text="FontAwesome class, e.g. fas fa-lightbulb")
    order = models.IntegerField(default=0, help_text="Display order")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Solution"
        verbose_name_plural = "Solutions"

    def __str__(self):
        return self.title


class Value(models.Model):
    """
    Model for company values displayed on About Us page.
    """
    about_us = models.ForeignKey(AboutUs, related_name='values', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(
        max_length=100,
        blank=True,
        help_text="FontAwesome icon class (e.g., 'fas fa-heart')"
    )
    order = models.IntegerField(default=0, help_text="Display order")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Value"
        verbose_name_plural = "Values"

    def __str__(self):
        return self.title
