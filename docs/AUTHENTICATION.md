# Authentication Documentation

## Overview

The application uses JWT (JSON Web Tokens) for authentication. Users authenticate with email and password, and receive access and refresh tokens for subsequent API requests.

## Authentication Flow

### 1. Registration

**Endpoint**: `POST /api/users/register/`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Process**:
1. Backend validates email uniqueness and password strength
2. Creates new CustomUser instance
3. Hashes password using Django's password hasher
4. Generates username from email (handles duplicates)
5. Returns JWT tokens and user data

**Response**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_superuser": false,
    "is_staff": false
  }
}
```

### 2. Login

**Endpoint**: `POST /api/users/login/`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Process**:
1. Backend validates email and password
2. Checks if user account is active
3. Generates JWT tokens (access + refresh)
4. Returns tokens and user data

**Response**: Same format as registration

### 3. Token Storage

**Frontend Implementation**:
- Tokens stored in `localStorage`
- `access_token`: Used for API requests (short-lived, ~60 minutes)
- `refresh_token`: Used to obtain new access tokens (longer-lived, ~7 days)

**Location**: `frontend/src/services/api.js`

### 4. Authenticated Requests

**Axios Interceptor**:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

All API requests automatically include the JWT token in the Authorization header.

### 5. Token Refresh

**Automatic Refresh** (handled by interceptor):
- When API returns 401 Unauthorized
- Interceptor attempts to refresh using `refresh_token`
- If successful, retries original request with new token
- If refresh fails, redirects to login page

**Manual Refresh Endpoint**: `POST /api/users/token/refresh/`

**Request Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## User Model

**Location**: `users/models.py`

**Custom User Model**: Extends Django's `AbstractUser`

**Additional Fields**:
- `email`: Unique email field (used for login)
- `bio`: Optional biography field

**Built-in Fields** (from AbstractUser):
- `username`: Auto-generated from email
- `first_name`, `last_name`: User's name
- `is_active`: Account status
- `is_staff`: Staff access to admin
- `is_superuser`: Superuser privileges
- `date_joined`: Registration timestamp

## Permission Levels

### 1. Unauthenticated (Public)
- Can view: Home, About, Blog, Projects, Services, Contact
- Cannot access: Dashboard, Quotes, Admin Panel

### 2. Authenticated Users
- All public access
- Can access: Dashboard, Quotes (submit requests)
- Cannot access: Admin Panel

### 3. Superusers/Admins
- All authenticated user access
- Can access: Admin Panel (`/admin/*`)
- Full CRUD access to all models via admin

## Route Protection

### Frontend Protection

**ProtectedRoute Component**: `frontend/src/components/ProtectedRoute.js`

**Usage**:
```javascript
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute requireAuth={true}>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/admin" 
  element={
    <ProtectedRoute requireSuperuser={true}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

**Protection Levels**:
- `requireAuth={true}`: Requires authentication
- `requireSuperuser={true}`: Requires superuser status
- No prop: Public access

### Backend Protection

**ViewSet Permissions**:

```python
# Public read, authenticated write
permission_classes = [IsAuthenticatedOrReadOnly]

# Authenticated only
permission_classes = [IsAuthenticated]

# Admin/superuser only
permission_classes = [IsAdminUser]
```

**Location**: Defined in each app's `views.py`

## AuthContext

**Location**: `frontend/src/contexts/AuthContext.js`

**Provides**:
- `user`: Current user object (null if not authenticated)
- `isAuthenticated`: Boolean authentication status
- `loading`: Loading state during auth check
- `login(email, password)`: Login function
- `register(userData)`: Registration function
- `logout()`: Logout function

**Usage**:
```javascript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.first_name}!</div>;
};
```

## Security Considerations

### JWT Token Configuration

**Location**: `PathyCodeback/settings.py`

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

### Password Security

- Passwords are hashed using Django's PBKDF2 algorithm
- Never stored in plain text
- Password validation enforced (minimum length, complexity)

### Token Storage

**Current Implementation**: localStorage
- **Pros**: Easy to implement, works across tabs
- **Cons**: Vulnerable to XSS attacks

**Production Recommendations**:
- Consider httpOnly cookies for token storage
- Implement CSRF protection
- Use HTTPS in production
- Set secure cookie flags

## API Endpoints Summary

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/users/register/` | POST | No | User registration |
| `/api/users/login/` | POST | No | User login |
| `/api/users/token/refresh/` | POST | No | Refresh access token |
| `/api/users/profile/` | GET | Yes | Get current user profile |
| `/api/users/list/` | GET | Admin | List all users |

## Common Issues

### Token Expired
- Interceptor automatically attempts refresh
- If refresh fails, user redirected to login
- Solution: User needs to log in again

### Cannot Access Admin Panel
- Verify user has `is_superuser=True`
- Check `is_staff=True` (usually same as superuser)
- Verify route protection in `App.js`

### Login Fails
- Check email/password are correct
- Verify user account is active (`is_active=True`)
- Check backend server is running
- Review browser console for errors

