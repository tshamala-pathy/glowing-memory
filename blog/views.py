from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination 
from .models import BlogPost
from .serializers import BlogPostSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows blog posts to be viewed, created, updated, or deleted.

    Features:
    - Permissions: Requires authentication for all operations.
    - Searchable by title, body, category, and tags.
    - Filterable by category.
    - Ordered by created_at (newest first) or title.
    - Paginates results using page number.
    """
    queryset = BlogPost.objects.all().order_by('-created_at')
    serializer_class = BlogPostSerializer
    permission_classes = [IsAuthenticated]  # Require authentication for all operations
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'body', 'category', 'tags']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    pagination_class = PageNumberPagination
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    # Pagination settings can be customized here if needed