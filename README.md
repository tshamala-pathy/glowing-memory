# PathyCode Portfolio & Client Management Platform

[![Django 5.2.3](https://img.shields.io/badge/Django-5.2.3-darkgreen?logo=django)](https://www.djangoproject.com/)
[![React 18](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.16.0-red)](https://www.django-rest-framework.org/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT-orange)](https://jwt.io/)

A comprehensive full-stack web application built with **Django REST Framework** and **React** that combines a professional portfolio showcase with a complete client management system. Designed for freelancers, agencies, and service providers to manage projects, quotes, invoices, and client communications.

## 🎯 Key Features

### Public-Facing Features
- **Portfolio Showcase**: Display completed projects with technologies, images, live links, and GitHub repositories
- **Blog System**: Publish articles with categories and tags; category filtering for readers
- **Services Catalog**: Showcase services with pricing, features, and optional icons
- **Testimonials**: Display customer testimonials with ratings and featured highlights
- **Search Functionality**: Global search across projects, blog posts, and services
- **Newsletter Subscription**: Collect subscriber emails for marketing campaigns

### Client Portal (Authenticated Users)
- **Profile Dashboard**: Central hub for authenticated users
- **Quote Management**: Submit, track, and respond to quote requests
- **Project Access**: View assigned projects and track progress
- **Invoice & Payment**: Access invoices and complete payments via PayFast integration
- **Messaging**: Real-time communication threads between clients and admins
- **Activity Log**: Track all user actions for transparency and audit trail

### Business & Admin Features
- **Quote Workflow**: Complete quote lifecycle (pending → reviewed → approved → payment → invoice → project)
- **Invoice Management**: Auto-generate invoices from approved quotes with VAT calculations (configurable)
- **Payment Processing**: Integrated PayFast payment gateway with ITN callbacks and simulate mode for local development
- **Client Management**: Track business clients (customers) separately from auth users; includes logos and company info
- **Project Management**: Create projects from paid invoices; track status, progress, and deliverables
- **Task Management**: Internal project tasks (admin-only) with priority and due dates
- **Case Studies**: Document detailed project success stories with metrics and results
- **File Sharing**: Upload/download project files shared between clients and admins
- **Admin Dashboard**: Comprehensive backend for content and business data management

### Security & Access Control
- **JWT Authentication**: Stateless token-based auth with refresh token mechanism
- **Role-Based Access**: User, staff, and superuser permission levels
- **Notifications**: In-app notification system for quote updates, project changes, and messages
- **Activity Auditing**: Complete audit trail of user actions and state changes
- **Email Verification**: Track email verification status for users

## 📚 Technology Stack

### Backend
- **Framework**: Django 5.2.3
- **API**: Django REST Framework 3.16.0
- **Authentication**: JWT (djangorestframework-simplejwt 5.5.0)
- **Database**: SQLite (development) / PostgreSQL 2.9.10 (production)
- **Payment Processing**: PayFast integration (native, no extra package needed)
- **Document Generation**: ReportLab 4.2.5 (invoice PDFs)
- **CORS**: django-cors-headers 4.6.0
- **Filtering**: django-filter 24.3
- **Image Processing**: Pillow 11.3.0

### Frontend
- **UI Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Authentication**: JWT token management in local storage

## 🚀 Quick Start

### Prerequisites
- **Python** 3.8+
- **Node.js** 14+ and npm
- **Git**
- PostgreSQL (production) or SQLite (development)

### Backend Setup

1. **Clone the repository and navigate to project root**
```bash
git clone <repository-url>
cd glowing-memory
```

2. **Create and activate Python virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Create .env file in project root
cp .env.example .env  # or create manually

# Key variables to set:
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

5. **Run database migrations**
```bash
python manage.py migrate
```

6. **Create superuser account** (for admin access)
```bash
python manage.py createsuperuser
```

7. **Start Django development server**
```bash
python manage.py runserver
```

Backend API available at: **http://localhost:8000**
Admin panel available at: **http://localhost:8000/admin**

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install Node dependencies**
```bash
npm install
```

3. **Create frontend environment file** (if needed)
```bash
# .env or .env.local in frontend/ directory
REACT_APP_API_URL=http://localhost:8000
```

4. **Start React development server**
```bash
npm start
```

Frontend available at: **http://localhost:3000**

### Quick Start with Scripts (Windows)
```bash
# Start both servers from root directory
start_backend.bat
start_frontend.bat
```

## 📁 Project Structure

```
glowing-memory/
├── PathyCodeback/              # Django project root (settings, URLs, WSGI)
│   ├── settings.py             # Django configuration, authentication, database
│   ├── urls.py                 # Root API routing
│   ├── views.py                # Global search functionality
│   └── wsgi.py                 # WSGI application
│
├── users/                       # User authentication & profiles
│   ├── models.py               # CustomUser, Notification, ActivityLog
│   ├── serializers.py          # User serialization
│   └── views.py                # Registration, login, token refresh
│
├── clients/                     # Client business entity management
│   ├── models.py               # Client, Project, ProjectFile, Task, CaseStudy
│   ├── views.py                # Client CRUD, project management
│   └── signals.py              # Auto-create client profile on user registration
│
├── quotes/                      # Quote request management
│   ├── models.py               # Quote (status: pending→reviewed→approved→declined)
│   ├── views.py                # Quote submission, admin review, client response
│   └── serializers.py          # Quote serialization
│
├── invoices/                    # Invoice & payment management
│   ├── models.py               # Invoice (auto-generated from approved quotes)
│   ├── views.py                # Invoice listing and PDF generation
│   └── serializers.py          # Invoice serialization
│
├── payments/                    # PayFast payment integration
│   ├── models.py               # Payment (PayFast transaction tracking)
│   ├── views.py                # Payment endpoints, ITN callback handler
│   └── README.md               # PayFast setup and integration guide
│
├── messaging/                   # Project communication threads
│   ├── models.py               # MessageThread, Message (client-admin chat per project)
│   └── views.py                # Thread listing and messaging
│
├── blog/                        # Blog/content management
│   ├── models.py               # BlogPost with categories and tags
│   ├── views.py                # Blog listing, filtering, search
│   └── serializers.py          # BlogPost serialization
│
├── projects/                    # Portfolio projects (public)
│   ├── models.py               # Project (showcase portfolio, can be filtered)
│   ├── views.py                # Project filtering, search, detail views
│   └── serializers.py          # Project serialization
│
├── services/                    # Service offerings
│   ├── models.py               # Service with features, pricing, featured flag
│   ├── views.py                # Service listing and filtering
│   └── serializers.py          # Service serialization
│
├── testimonials/               # Customer testimonials
│   ├── models.py               # Testimonial (rating, is_approved, is_featured)
│   ├── views.py                # Testimonial submission and listing
│   └── serializers.py          # Testimonial serialization
│
├── contact/                    # Contact form submissions
│   ├── models.py               # ContactMessage (linked to client when authenticated)
│   ├── views.py                # Contact form submission handling
│   └── serializers.py          # ContactMessage serialization
│
├── newsletter/                 # Email subscription
│   ├── models.py               # NewsletterSubscription
│   ├── views.py                # Newsletter signup endpoint
│   └── serializers.py          # Subscription serialization
│
├── about/                      # About page content
│   ├── models.py               # About page data
│   └── views.py                # About content endpoint
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable components (Navbar, Footer, etc.)
│   │   ├── pages/              # Page components
│   │   │   ├── Home.js
│   │   │   ├── About.js
│   │   │   ├── Blog.js, BlogDetail.js
│   │   │   ├── Projects.js, ProjectDetail.js, PublicProjects.js
│   │   │   ├── Services.js, ServiceDetail.js
│   │   │   ├── Contact.js
│   │   │   ├── Testimonials.js
│   │   │   ├── Login.js, Register.js, ForgotPassword.js
│   │   │   ├── Profile.js (user dashboard)
│   │   │   ├── ClientPortal.js (client hub)
│   │   │   ├── ClientProjects.js (client project tracking)
│   │   │   ├── Quotes.js (quote management)
│   │   │   ├── Payment.js (PayFast integration)
│   │   │   ├── Messages.js, ThreadChat.js (messaging)
│   │   │   ├── AdminDashboard.js (admin panel)
│   │   │   └── SearchResults.js
│   │   ├── contexts/           # React Context providers (Auth, User, etc.)
│   │   └── services/           # API service clients (Axios-based)
│   ├── public/                 # Static assets
│   └── package.json
│
├── docs/                       # Documentation (Sphinx-based)
│   ├── ARCHITECTURE.md         # System architecture and data flow
│   ├── AUTHENTICATION.md       # Auth flow and security details
│   ├── USER_AND_CLIENT_GUIDE.md # User vs Client distinction
│   ├── QUOTES_WORKFLOW.md      # Quote lifecycle
│   └── ...
│
├── media/                      # User-uploaded files (images, documents)
│   ├── users/avatars/          # User profile pictures
│   ├── clients/logos/          # Client company logos
│   ├── clients/projects/       # Project hero images
│   ├── project_files/          # Shared project files
│   ├── blog/                   # Blog featured images
│   ├── services/               # Service images
│   └── testimonials/           # Testimonial profile images
│
├── .github/workflows/          # GitHub Actions CI/CD
│   └── docs.yml                # Auto-build and deploy Sphinx docs
│
├── requirements.txt            # Python dependencies
├── manage.py                   # Django management script
├── Dockerfile                  # Docker containerization
├── docker-compose.yml          # Docker multi-container setup
├── .env.example                # Example environment variables
└── README.md                   # This file
```

## 🔐 Authentication & Security

### Authentication System
- **JWT Tokens**: Stateless authentication using djangorestframework-simplejwt
- **Token Endpoints**:
  - `POST /api/users/register/` - User registration
  - `POST /api/users/login/` - User login (returns access & refresh tokens)
  - `POST /api/users/token/refresh/` - Refresh expired access token
  - `GET /api/users/profile/` - Authenticated user profile

### User Model
The `CustomUser` model extends Django's AbstractUser with:
- Email (unique) for authentication
- Optional bio and avatar for profiles
- Email verification tracking
- Role-based permissions (staff, superuser)

### Client vs User
- **User**: Authentication identity (login/password, permissions)
- **Client**: Business entity (owns quotes, invoices, projects, receives services)
- Each user has exactly one client profile (auto-created on registration)
- See [User and Client Guide](docs/USER_AND_CLIENT_GUIDE.md) for detailed relationship

### Access Control
| Section | Public | Authenticated | Superuser |
|---------|--------|---------------|-----------|
| Home, About, Blog, Services, Contact | ✅ | ✅ | ✅ |
| Portfolio Projects (public projects only) | ✅ | ✅ | ✅ |
| Testimonials, Newsletter | ✅ | ✅ | ✅ |
| User Profile, Client Portal | ❌ | ✅ | ✅ |
| My Projects, Quotes, Messages | ❌ | ✅ | ✅ |
| Invoices, Payment | ❌ | ✅ | ✅ |
| Admin Panel, All CRUD | ❌ | ❌ | ✅ |

### Security Features
- **Email Verification**: Track and enforce email verification
- **CORS Protection**: Configure allowed origins in settings
- **Activity Logging**: Audit trail of all user actions (`ActivityLog` model)
- **In-App Notifications**: Alerts for quote updates, project changes, payments
- **Password Security**: Uses Django's password hashing with bcrypt

## 🎛️ Admin Features

### Admin Access Points
1. **Django Admin Panel** at `/admin/` - Full model CRUD
2. **Custom Admin Dashboard** at `/admin/dashboard` - Analytics and quick actions

### Quote Management
- Review pending quotes with client details
- Set estimated prices and delivery timelines
- Approve or decline quotes
- Send responses to clients with estimated amounts
- Track all quote state transitions

### Invoice & Payment Workflow
- **Auto-Generate Invoices**: From approved quotes
- **VAT Configuration**: Set VAT rate (default 15% for South Africa)
- **Payment Tracking**: Monitor PayFast payment status
- **Invoice Status**: draft → unpaid → paid or overdue/cancelled
- **Multiple Payment Methods**: Bank transfer, credit card, PayPal, cash

### Project Lifecycle Management
1. **Auto-Creation**: Projects auto-created when invoice is marked "paid"
2. **Status Tracking**: planning → design → development → testing → completed
3. **Progress Monitoring**: Update progress percentage (0-100%)
4. **File Sharing**: Upload/download shared files with clients
5. **Task Management**: Create admin-only internal tasks with priorities

### Client & Business Management
- Manage client business profiles (separate from auth users)
- Track industry, logos, company information
- View complete communication history per client
- Create and manage case studies with metrics
- Internal notes (not visible to clients)

### Content Management
- Blog posts with categories and tags
- Service offerings with pricing and features
- Featured services and testimonials
- Newsletter subscriber management
- Testimonial approval and featuring

## Documentation & GitHub Pages

This project includes Sphinx-based documentation under the `docs/` directory.

- **Live docs**: After pushing to the default branch (`main`/`master`), GitHub Actions builds the Sphinx HTML docs and deploys them to the `gh-pages` branch. Enable GitHub Pages in repository settings to host docs.
- **Build locally**:

  ```bash
  # From repo root
  venv\Scripts\activate  # or source venv/bin/activate on Linux/Mac
  python -m pip install -r requirements.txt
  cd docs
  python -m sphinx -b html . build/html
  # Open docs/build/html/index.html in browser
  ```

The workflow configuration lives in `.github/workflows/docs.yml` and does not affect application logic or runtime behavior.

## Key Documentation

- **[User and Client Guide](docs/USER_AND_CLIENT_GUIDE.md)**: User vs Client distinction, relationship, and data architecture
- **[Architecture Guide](docs/ARCHITECTURE.md)**: Complete system design, data flows, and deployment notes
- **[Authentication Guide](docs/AUTHENTICATION.md)**: JWT auth flow and security implementation
- **[Quote Workflow](QUOTES_AND_INVOICES_WORKFLOW.md)**: End-to-end quote to invoice to project lifecycle
- **[PayFast Integration](payments/README.md)**: Payment processing and webhook setup
- **[Client Projects Workflow](CLIENT_PROJECTS_WORKFLOW.md)**: Business workflow for managing client projects

## 📡 API Overview

### Base URL
```
http://localhost:8000/api/
```

### Comprehensive API Endpoints

#### Authentication & Users
```
POST   /users/register/          - Register new user
POST   /users/login/             - Login (returns tokens)
POST   /users/token/refresh/     - Refresh access token
GET    /users/profile/           - Get authenticated user profile
```

#### Portfolio Projects
```
GET    /projects/                - List projects (filterable, public)
GET    /projects/{id}/           - Project details
POST   /projects/                - Create project (auth required)
PUT    /projects/{id}/           - Update project (auth required)
DELETE /projects/{id}/           - Delete project (auth required)
```

#### Client Business Projects
```
GET    /clients/                 - List clients (admin)
GET    /clients/{id}/            - Client details with projects
POST   /clients/                 - Create client (admin)
GET    /clients/{id}/projects/   - Client's assigned projects
```

#### Quote Management
```
GET    /quotes/                  - List quotes (filtered by user/admin role)
POST   /quotes/                  - Submit new quote request
GET    /quotes/{id}/             - Quote details
PATCH  /quotes/{id}/             - Update quote (admin reviews or client responds)
```

#### Invoices & Payments
```
GET    /invoices/                - List invoices
GET    /invoices/{id}/           - Invoice details
GET    /invoices/{id}/pdf/       - Download invoice PDF
POST   /payments/                - Create payment record
GET    /payments/{id}/           - Payment status
POST   /payments/payfast-callback/ - PayFast ITN webhook (server to server)
POST   /payments/simulate-itn/   - Test PayFast locally (dev only)
```

#### Messaging
```
GET    /threads/                 - List message threads
GET    /threads/{id}/messages/   - Get thread messages
POST   /threads/{id}/messages/   - Send message
```

#### Blog
```
GET    /blog/                    - List blog posts (filterable by category/tag)
GET    /blog/{id}/               - Blog post details
POST   /blog/                    - Create blog post (admin)
PUT    /blog/{id}/               - Update blog post (admin)
```

#### Services
```
GET    /services/                - List services
GET    /services/{id}/           - Service details
POST   /services/                - Create service (admin)
PUT    /services/{id}/           - Update service (admin)
```

#### Content & Community
```
GET    /testimonials/            - List approved testimonials
POST   /testimonials/            - Submit testimonial
POST   /newsletter/subscribe/    - Subscribe to newsletter
POST   /contact/                 - Submit contact form
GET    /search/?q=query          - Global search (projects, blog, services)
```

Full API request/response documentation available in [Architecture Guide](docs/ARCHITECTURE.md).

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for dev, PostgreSQL for prod)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
# For PostgreSQL: 
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=pathycode
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_HOST=localhost

# JWT
JWT_SECRET_KEY=your-jwt-secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# PayFast Integration
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
PAYFAST_SANDBOX=True

# Email (for notifications, future use)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

See `PathyCodeback/settings.py` for all available configuration options.

## 🛠️ Development & Deployment

### Development Commands

```bash
# Run development server
python manage.py runserver

# Create database migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser account
python manage.py createsuperuser

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic
```

### Production Deployment Checklist

- [ ] Set `DEBUG = False` in settings
- [ ] Configure `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your domain(s)
- [ ] Use PostgreSQL database (not SQLite)
- [ ] Configure nginx for static/media file serving
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure email backend for notifications
- [ ] Set up regular database backups
- [ ] Configure proper logging
- [ ] Enable CSRF protection for forms
- [ ] Configure rate limiting
- [ ] Set up monitoring and error tracking (Sentry, etc.)

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Apply migrations in container
docker-compose exec web python manage.py migrate

# Create superuser in container
docker-compose exec web python manage.py createsuperuser
```

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following project conventions
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please ensure all tests pass and code follows the project style guidelines.

## 💬 Support & Issues

- **Questions?** Check the [documentation](docs/) folder
- **Found a bug?** Open an [issue](../../issues)
- **Feature request?** Submit an issue with the `enhancement` label

## 🙏 Acknowledgments

- Built with [Django](https://www.djangoproject.com/) and [React](https://react.dev/)
- Payment processing with [PayFast](https://www.payfast.io/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Authenticated with [JWT](https://jwt.io/)
