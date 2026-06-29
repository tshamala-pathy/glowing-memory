"""
Public API views for the PathyCodeback project root.

Currently exposes a single global search endpoint aggregating projects, blog posts,
and services. Search is intentionally anonymous-friendly: JWT is not required so
expired tokens do not block public discovery.
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.db.models import Q
from django.utils.html import strip_tags
from projects.models import Project
from blog.models import BlogPost
from services.models import Service


def _blog_search_snippet(body: str, max_len: int = 220) -> str:
    """Plain-text excerpt for search results (body may contain HTML)."""
    if not body:
        return ''
    plain = strip_tags(body).strip()
    if len(plain) <= max_len:
        return plain
    return plain[: max_len - 1].rstrip() + '…'


@api_view(['GET'])
@authentication_classes([])  # Skip JWT — expired Bearer tokens must not 401 this public endpoint
@permission_classes([AllowAny])
def search(request):
    """
    Global search across portfolio projects, blog posts, and services.
    Query param: q (required). Returns matches with id, title, description, type, url.
    """
    query = request.GET.get('q', '').strip()
    
    if not query:
        return Response(
            {'detail': 'Search query parameter "q" is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = {
        'projects': [],
        'blog_posts': [],
        'services': [],
        'total': 0
    }
    
    # Search projects
    projects = Project.objects.filter(
        Q(title__icontains=query) |
        Q(description__icontains=query) |
        Q(technologies__icontains=query) |
        Q(tags__icontains=query)
    )[:10]
    
    results['projects'] = [
        {
            'id': p.id,
            'title': p.title,
            'description': p.description[:200] + '...' if len(p.description) > 200 else p.description,
            'type': 'project',
            'url': f'/projects/{p.id}'
        }
        for p in projects
    ]
    
    # Search blog posts
    blog_posts = BlogPost.objects.filter(
        Q(title__icontains=query) |
        Q(body__icontains=query) |
        Q(category__icontains=query) |
        Q(tags__icontains=query)
    )[:10]
    
    results['blog_posts'] = [
        {
            'id': p.id,
            'title': p.title,
            'description': _blog_search_snippet(p.body or ''),
            'type': 'blog',
            'url': f'/blog/{p.id}'
        }
        for p in blog_posts
    ]
    
    # Search services
    services = Service.objects.filter(
        Q(name__icontains=query) |
        Q(description__icontains=query)
    )[:10]
    
    results['services'] = [
        {
            'id': s.id,
            'title': s.name,
            'description': (s.description[:200] + '...' if len(s.description) > 200 else s.description),
            'type': 'service',
            'url': f'/services/{s.id}'
        }
        for s in services
    ]
    
    results['total'] = len(results['projects']) + len(results['blog_posts']) + len(results['services'])
    
    return Response(results, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    """Lightweight health check for load balancers and container orchestration."""
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False
    payload = {'status': 'ok' if db_ok else 'degraded', 'database': 'ok' if db_ok else 'error'}
    code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(payload, status=code)

