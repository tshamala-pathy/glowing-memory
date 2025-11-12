# PathyCode - Django + React Full-Stack Application

A modern full-stack web application built with Django REST Framework backend and React frontend.

## Features

- **User Authentication**: JWT-based authentication system
- **Blog Management**: Create, read, update, and delete blog posts
- **Project Portfolio**: Showcase your projects with images and descriptions
- **Service Management**: Manage and display your services
- **Contact System**: Handle contact form submissions
- **Responsive Design**: Modern UI with Tailwind CSS
- **API Integration**: Seamless communication between frontend and backend

## Tech Stack

### Backend
- Django 5.2.3
- Django REST Framework
- Django CORS Headers
- JWT Authentication
- SQLite (development) / PostgreSQL (production)
- Python 3.13+

### Frontend
- React 19.1.0
- React Router DOM
- Axios for API calls
- Tailwind CSS for styling
- Context API for state management

## Project Structure

```
glowing-memory/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env                     # Environment variables (create this)
├── PathyCodeback/           # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── users/                   # User management app
├── blog/                    # Blog app
├── projects/                # Projects app
├── services/                # Services app
├── contact/                 # Contact app
└── frontend/                # React application
    ├── src/
    │   ├── components/      # Reusable React components
    │   ├── pages/          # Page components
    │   ├── contexts/       # React contexts
    │   ├── services/       # API services
    │   └── utils/          # Utility functions
    ├── package.json
    └── tailwind.config.js
```

## Setup Instructions

### Prerequisites
- Python 3.13+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd glowing-memory
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file**
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
   DB_ENGINE=django.db.backends.sqlite3
   DB_NAME=db.sqlite3
   DB_USER=
   DB_PASSWORD=
   DB_HOST=
   DB_PORT=
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start Django server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start React development server**
   ```bash
   npm start
   ```

## Running the Application

1. **Start Django backend** (Terminal 1)
   ```bash
   python manage.py runserver
   ```
   Backend will be available at: http://127.0.0.1:8000

2. **Start React frontend** (Terminal 2)
   ```bash
   cd frontend
   npm start
   ```
   Frontend will be available at: http://localhost:3000

## API Endpoints

- **Authentication**
  - `POST /api/users/register/` - User registration (returns JWT tokens)
  - `POST /api/users/login/` - User login with email (returns JWT tokens and user data)
  - `POST /api/users/token/` - Alternative login endpoint
  - `POST /api/users/token/refresh/` - Refresh JWT token
  - `GET /api/users/profile/` - Get current user profile (authenticated)

- **Blog**
  - `GET /api/blog/` - List blog posts
  - `POST /api/blog/` - Create blog post (authenticated)
  - `GET /api/blog/{id}/` - Get blog post
  - `PUT /api/blog/{id}/` - Update blog post (authenticated)
  - `DELETE /api/blog/{id}/` - Delete blog post (authenticated)

- **Projects**
  - `GET /api/projects/` - List projects
  - `POST /api/projects/` - Create project (authenticated)
  - `GET /api/projects/{id}/` - Get project
  - `PUT /api/projects/{id}/` - Update project (authenticated)
  - `DELETE /api/projects/{id}/` - Delete project (authenticated)

- **Services**
  - `GET /api/services/` - List services
  - `POST /api/services/` - Create service (authenticated)
  - `GET /api/services/{id}/` - Get service
  - `PUT /api/services/{id}/` - Update service (authenticated)
  - `DELETE /api/services/{id}/` - Delete service (authenticated)

- **Contact**
  - `GET /api/contact/` - List contact messages (authenticated)
  - `POST /api/contact/` - Submit contact form
  - `GET /api/contact/{id}/` - Get contact message (authenticated)

## Features Overview

### Authentication System
- User registration and login
- JWT token-based authentication
- Protected routes and API endpoints
- User profile management

### Blog System
- Create and manage blog posts
- Rich text content support
- Tag system for categorization
- Featured images
- Author attribution

### Project Portfolio
- Showcase projects with descriptions
- Technology stack tags
- GitHub and live demo links
- Project status tracking
- Image galleries

### Service Management
- Service catalog with pricing
- Feature lists
- Category organization
- Service descriptions

### Contact System
- Contact form with validation
- Message management
- Email notifications (configurable)

## Development

### Adding New Features

1. **Backend**: Create new Django apps or extend existing ones
2. **Frontend**: Add new components in `frontend/src/components/`
3. **API Integration**: Update `frontend/src/services/api.js`
4. **Routing**: Add new routes in `frontend/src/App.js`

### Styling
The project uses Tailwind CSS for styling. Custom styles can be added to:
- `frontend/src/App.css` for global styles
- Component-specific styles using Tailwind classes

## Deployment

### Backend Deployment
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables for production
3. Set `DEBUG=False` in production
4. Use a production WSGI server like Gunicorn
5. Set up static file serving

### Frontend Deployment
1. Build the React app: `npm run build`
2. Serve the build folder with a web server
3. Configure API base URL for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact us through the contact form or create an issue in the repository.