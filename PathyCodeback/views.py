from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from projects.models import Project
from blog.models import BlogPost
from services.models import Service

@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    """
    Global search endpoint that searches across projects, blog posts, and services.
    Query parameter: 'q' - search query string
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
            'description': p.body[:200] + '...' if len(p.body) > 200 else p.body,
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

