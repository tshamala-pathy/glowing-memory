# Project Architecture Documentation

## Overview

This is a full-stack web application built with Django REST Framework (backend) and React (frontend). The application provides a portfolio/content management system with user authentication, project management, blog functionality, quote requests, and administrative features.

## Technology Stack

### Backend
- **Framework**: Django 5.2.3
- **API**: Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production-ready)
- **Authentication**: JWT (JSON Web Tokens) via django-rest-framework-simplejwt
- **Media Storage**: Local file system (media/ directory)

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **State Management**: React Context API (for authentication)

## Project Structure

```
glowing-memory/
├── PathyCodeback/          # Django project root
│   ├── settings.py         # Django configuration
│   ├── urls.py            # Root URL configuration
│   └── ...
├── users/                  # User authentication app
├── projects/               # Project portfolio app
├── blog/                   # Blog posts app
├── services/               # Services catalog app
├── contact/                # Contact messages app
├── quotes/                 # Quote requests app
├── invoices/               # Invoice management app
├── testimonials/           # Customer testimonials app
├── newsletter/             # Newsletter subscriptions app
├── about/                  # About page content app
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React Context providers
│   │   └── services/       # API service layer
│   └── ...
└── media/                  # User-uploaded files (project images, etc.)
```

## Data Flow

### Authentication Flow

1. **User Registration/Login**:
   - User submits credentials via frontend form
   - Frontend sends POST request to `/api/users/register/` or `/api/users/login/`
   - Backend validates credentials and generates JWT tokens (access + refresh)
   - Tokens are stored in browser localStorage
   - Frontend AuthContext updates user state

2. **Authenticated Requests**:
   - Axios interceptor adds `Authorization: Bearer <token>` header to requests
   - Backend validates token on protected endpoints
   - If token expires, interceptor attempts refresh using refresh token
   - On refresh failure, user is redirected to login

3. **Route Protection**:
   - `ProtectedRoute` component wraps protected routes
   - Checks authentication status from AuthContext
   - Redirects unauthorized users to `/login`
   - Superuser routes require additional `is_superuser` check

### Media File Handling

1. **Image Upload** (Admin/API):
   - Images are uploaded via Django admin or API
   - Files stored in `media/projects/` directory
   - Database stores relative path (e.g., `projects/image.jpg`)

2. **Image URL Generation**:
   - `ProjectSerializer.get_image()` method builds absolute URLs
   - Uses request context to get scheme (http/https) and host
   - Returns full URL: `http://localhost:8000/media/projects/image.jpg`

3. **Frontend Display**:
   - Frontend receives absolute or relative URL from API
   - `getImageUrl()` helper ensures absolute URL
   - Images load directly from Django server
   - Placeholder shown if image fails to load

### Quote Request Workflow

1. **User Submits Quote**:
   - Authenticated user fills form on `/quotes` page
   - Frontend sends POST to `/api/quotes/`
   - Backend creates Quote record with status='Pending'

2. **Admin Review**:
   - Admin accesses Django admin panel at `/admin`
   - Views all quote requests in Quotes section
   - Can filter by status, search by client/project details
   - Updates status, adds estimated amount, assigns to team member

3. **Admin Response**:
   - Admin adds notes in admin panel
   - Can change status (Pending → Approved/Rejected/In Progress)
   - Team member can be assigned via `assigned_to` field

## Authentication Logic

### Permission Levels

1. **Public Access**:
   - Home page, About, Blog, Projects (list/view), Services, Contact
   - No authentication required
   - Read-only access to content

2. **Authenticated Users**:
   - Dashboard, Quotes request page
   - Can submit quote requests
   - Can view personal dashboard

3. **Superusers/Admins**:
   - All authenticated user access
   - Admin panel (`/admin/*`)
   - Full CRUD on all models via admin interface
   - User management page

### Permission Implementation

**Backend (Django)**:
- ViewSets use `permission_classes` to define access levels
- `IsAuthenticatedOrReadOnly`: Public read, authenticated write
- `IsAdminUser`: Admin/superuser only
- `IsAuthenticated`: Authenticated users only

**Frontend (React)**:
- `ProtectedRoute` component wraps routes
- `requireAuth={true}`: Requires login
- `requireSuperuser={true}`: Requires superuser status
- Navbar conditionally renders links based on auth status

## Media Handling

### Configuration

**Settings** (`PathyCodeback/settings.py`):
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**URLs** (`PathyCodeback/urls.py`):
- In DEBUG mode, Django serves media files directly
- In production, web server (nginx/Apache) should serve media files

### URL Construction

**Backend Serializer**:
```python
def get_image(self, obj):
    request = self.context.get('request')
    scheme = request.scheme  # http or https
    host = request.get_host()  # localhost:8000
    return f"{scheme}://{host}{obj.image.url}"
```

**Frontend Helper**:
```javascript
const getImageUrl = (imageUrl) => {
  if (imageUrl?.startsWith('http')) return imageUrl;
  return `http://localhost:8000${imageUrl}`;
};
```

## API Endpoints

### Authentication
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login (email-based)
- `POST /api/users/token/refresh/` - Refresh JWT token
- `GET /api/users/profile/` - Get current user profile
- `GET /api/users/list/` - List all users (admin only)

### Projects
- `GET /api/projects/` - List all projects (public)
- `GET /api/projects/{id}/` - Get project details (public)
- `POST /api/projects/` - Create project (authenticated)
- `PUT/PATCH /api/projects/{id}/` - Update project (authenticated)
- `DELETE /api/projects/{id}/` - Delete project (authenticated)

### Quotes
- `POST /api/quotes/` - Submit quote request (authenticated)
- `GET /api/quotes/` - List quotes (admin only via admin panel)

## Security Considerations

1. **JWT Tokens**: Stored in localStorage (consider httpOnly cookies for production)
2. **CORS**: Configured to allow frontend origin in development
3. **Media Files**: Served by Django in development; should use CDN/web server in production
4. **Password Hashing**: Django's built-in password hashing (PBKDF2)
5. **CSRF**: Handled by Django REST Framework's token-based auth

## Deployment Notes

### Environment Variables
- `SECRET_KEY`: Django secret key (use strong random key in production)
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Configure for production domain
- `DB_ENGINE`: Use PostgreSQL in production
- `CORS_ALLOWED_ORIGINS`: Add production frontend URL

### Production Checklist
- [ ] Set `DEBUG = False`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use PostgreSQL database
- [ ] Set up web server (nginx) to serve static/media files
- [ ] Configure HTTPS/SSL certificates
- [ ] Set secure JWT token expiration times
- [ ] Use environment variables for sensitive config
- [ ] Set up proper logging
- [ ] Configure backup strategy for database and media files

