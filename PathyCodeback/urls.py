"""
URL configuration for PathyCodeback project.

API Endpoints:
- /api/profile/         — Aggregated profile (user, client, quotes, invoices, projects, messages, testimonials)
- /api/users/profile/   — User data only (for AuthContext)
- /api/users/           — Auth, register, token refresh
- /api/search/          — Full-text search
- /api/*/               — Projects, services, blog, contact, etc.
"""
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import search
from users.views import ProfileAggregateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/search/', search, name='search'),
    path('api/profile/', ProfileAggregateView.as_view(), name='profile_aggregate'),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/services/', include('services.urls')),
    path('api/blog/', include('blog.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/newsletter/', include('newsletter.urls')),
    path('api/testimonials/', include('testimonials.urls')),
    path('api/about/', include('about.urls')),
    path('api/quotes/', include('quotes.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/clients/', include('clients.urls')),
]

# ================================
# Media Files Configuration
# ================================
# Serve media files (user-uploaded files like project images) in development mode.
# In production, media files should be served by the web server (nginx, Apache, etc.)
# rather than Django for better performance and security.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
