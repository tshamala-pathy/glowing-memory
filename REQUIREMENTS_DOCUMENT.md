# PathyCode - Requirements Document

**Version:** 1.0  
**Date:** January 2026  
**Status:** Current Implementation

---

## 1. Project Overview

PathyCode is a full-stack web application built with Django (backend) and React (frontend) that serves as a portfolio and business management platform. The system provides:

- **Public-facing website** for showcasing projects, services, blog posts, and company information
- **Client portal** for authenticated users to view quotes and manage their interactions
- **Admin panel** for superusers to manage all content, users, invoices, and business operations
- **Business management** features including quotes, invoices, client management, and case studies

---

## 2. Tech Stack

### Backend
- **Framework:** Django 5.2.3
- **API:** Django REST Framework (DRF)
- **Authentication:** JWT (Simple JWT)
- **Database:** SQLite (default, configurable to PostgreSQL/MySQL)
- **File Storage:** Local filesystem (media directory)
- **Email:** Console backend (development), SMTP configurable (production)
- **Additional Packages:**
  - `django-cors-headers` - CORS support for React frontend
  - `django-filter` - Advanced filtering for APIs
  - `python-decouple` - Environment variable management

### Frontend
- **Framework:** React (with React Router v6)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **State Management:** React Context API (AuthContext)
- **Build Tool:** Create React App

### Development Tools
- **Version Control:** Git
- **Package Management:** 
  - Backend: pip (requirements.txt)
  - Frontend: npm

---

## 3. Implemented Features

### 3.1 Backend Features

#### 3.1.1 User Management (`users` app)
**Model:** `CustomUser` (extends Django's AbstractUser)
- **Fields:**
  - `username` (inherited)
  - `email` (unique, required)
  - `first_name`, `last_name` (inherited)
  - `bio` (optional text field)
  - `is_active`, `is_staff`, `is_superuser` (inherited)
  - `date_joined` (inherited)

**API Endpoints:**
- `POST /api/users/register/` - User registration (public)
- `POST /api/users/login/` - Email-based login (public)
- `POST /api/users/token/` - JWT token generation (public)
- `POST /api/users/token/refresh/` - Token refresh (public)
- `GET /api/users/profile/` - Get current user profile (authenticated)
- `PUT /api/users/profile/` - Update current user profile (authenticated)
- `GET /api/users/list/` - List all users (admin only, read-only)
- `GET /api/users/admin/` - List all users with full CRUD (admin only)
- `POST /api/users/admin/` - Create user (admin only)
- `PUT /api/users/admin/{id}/` - Update user (admin only)
- `DELETE /api/users/admin/{id}/` - Delete user (admin only)
- `POST /api/users/forgot-password/` - Password reset request (public)
- `POST /api/users/reset-password/` - Password reset confirmation (public)

**Features:**
- Email-based authentication (instead of username)
- JWT token-based authentication
- Password reset via email
- Admin user management with full CRUD
- Password validation using Django's validators

#### 3.1.2 Projects (`projects` app)
**Model:** `Project`
- **Fields:**
  - `title`, `description`
  - `technologies` (comma-separated string)
  - `image` (ImageField, optional)
  - `tags` (comma-separated string, optional)
  - `status` (choices: Completed, In Progress, Planned)
  - `category` (choices: Web, Mobile, Desktop, API, Other)
  - `github_url`, `live_url` (optional URLs)
  - `created_at`, `updated_at`

**API Endpoints:**
- `GET /api/projects/` - List projects (public read, authenticated write)
- `POST /api/projects/` - Create project (authenticated)
- `GET /api/projects/{id}/` - Get project detail (public)
- `PUT /api/projects/{id}/` - Update project (authenticated)
- `DELETE /api/projects/{id}/` - Delete project (authenticated)

**Features:**
- Filtering by status and category
- Search by title, description, technologies, tags
- Image upload support
- Absolute URL generation for images

#### 3.1.3 Blog (`blog` app)
**Model:** `BlogPost`
- **Fields:**
  - `title`, `body` (text content)
  - `category` (string)
  - `tags` (comma-separated string, optional)
  - `featured_image` (ImageField, optional)
  - `created_at`

**API Endpoints:**
- `GET /api/blog/` - List blog posts (public read, authenticated write)
- `POST /api/blog/` - Create blog post (authenticated)
- `GET /api/blog/{id}/` - Get blog post detail (public)
- `PUT /api/blog/{id}/` - Update blog post (authenticated)
- `DELETE /api/blog/{id}/` - Delete blog post (authenticated)

**Features:**
- Filtering by category
- Search by title, body, category, tags
- Pagination (20 items per page)
- Featured image support

#### 3.1.4 Services (`services` app)
**Model:** `Service`
- **Fields:**
  - `name` (service name)
  - `title` (legacy field, deprecated)
  - `description` (text)
  - `price` (Decimal, optional)
  - `features` (JSON array or comma-separated string)
  - `categories` (comma-separated string)
  - `icon` (string, optional - FontAwesome class)
  - `created_at`, `updated_at`

**API Endpoints:**
- `GET /api/services/` - List services (public read, authenticated write)
- `POST /api/services/` - Create service (authenticated)
- `GET /api/services/{id}/` - Get service detail (public)
- `PUT /api/services/{id}/` - Update service (authenticated)
- `DELETE /api/services/{id}/` - Delete service (authenticated)

**Features:**
- Features parsing (supports JSON and comma-separated)
- Categories parsing
- Legacy title field migration support

#### 3.1.5 Quotes (`quotes` app)
**Model:** `Quote`
- **Fields:**
  - Client info: `client_name`, `client_email`, `client_phone`, `company_name`
  - Project info: `project_title`, `project_description`, `project_type`, `budget_range`, `deadline`
  - Quote info: `estimated_amount`, `status` (Pending, Approved, Rejected, In Progress, Completed)
  - `assigned_to` (ForeignKey to User, optional)
  - `notes` (optional)
  - `created_at`, `updated_at`, `approved_at`

**API Endpoints:**
- `GET /api/quotes/` - List quotes (authenticated)
- `POST /api/quotes/` - Create quote (authenticated)
- `GET /api/quotes/{id}/` - Get quote detail (authenticated)
- `PUT /api/quotes/{id}/` - Update quote (authenticated)
- `DELETE /api/quotes/{id}/` - Delete quote (authenticated)

**Features:**
- Quote assignment to users
- Status tracking
- Client and project information management

#### 3.1.6 Invoices (`invoices` app)
**Model:** `Invoice`
- **Fields:**
  - `invoice_number` (unique, auto-generated)
  - `quote` (ForeignKey to Quote, optional)
  - Client info: `client_name`, `client_email`, `client_phone`, `client_address`, `client_company`, `client_vat_number`
  - Provider info: `provider_name`, `provider_address`, `provider_phone`, `provider_email`, `provider_vat_number`
  - `items` (JSONField - list of items with description, quantity, price)
  - Financial: `subtotal`, `vat_rate` (default 15%), `vat_amount`, `total_amount`, `amount_paid`, `amount_due`
  - Dates: `issue_date`, `due_date`, `paid_date`
  - `status` (Draft, Sent, Paid, Overdue, Cancelled)
  - `payment_method`, `payment_reference`, `notes`
  - `created_by` (ForeignKey to User)
  - `created_at`, `updated_at`

**API Endpoints:**
- `GET /api/invoices/` - List invoices (authenticated)
- `POST /api/invoices/` - Create invoice (authenticated)
- `GET /api/invoices/{id}/` - Get invoice detail (authenticated)
- `PUT /api/invoices/{id}/` - Update invoice (authenticated)
- `DELETE /api/invoices/{id}/` - Delete invoice (authenticated)
- `GET /api/invoices/{id}/pdf/` - Download PDF invoice (authenticated)
- `POST /api/invoices/{id}/mark_paid/` - Mark invoice as paid (authenticated)

**Features:**
- Automatic invoice number generation
- VAT calculation (15% default for South Africa)
- Automatic total calculation from items
- PDF generation for invoices
- Link to quotes
- Payment tracking

#### 3.1.7 About Us (`about` app)
**Model:** `AboutUs` (singleton pattern)
- **Fields:**
  - `title`, `hero_title`, `hero_subtitle`
  - `our_story_title`, `our_story_content`
  - `mission_title`, `mission_content`
  - `vision_title`, `vision_content`
  - `why_choose_us_title`, `why_choose_us_content`
  - `image` (ImageField, optional)
  - `created_at`, `updated_at`

**Model:** `Value` (related to AboutUs)
- **Fields:**
  - `about_us` (ForeignKey)
  - `title`, `description`
  - `icon` (FontAwesome class, optional)
  - `order` (display order)
  - `created_at`

**API Endpoints:**
- `GET /api/about/` - Get About Us content (public)
- `GET /api/about/admin/` - Get About Us for admin (authenticated)
- `POST /api/about/admin/` - Create/Update About Us (authenticated)
- `PUT /api/about/admin/{id}/` - Update About Us (authenticated)
- `GET /api/about/values/` - List values (authenticated)
- `POST /api/about/values/` - Create value (authenticated)
- `PUT /api/about/values/{id}/` - Update value (authenticated)
- `DELETE /api/about/values/{id}/` - Delete value (authenticated)

**Features:**
- Singleton pattern (only one AboutUs instance)
- Nested values management
- Image support

#### 3.1.8 Testimonials (`testimonials` app)
**Model:** `Testimonial`
- **Fields:**
  - `name`, `position`, `company` (optional)
  - `testimonial` (text)
  - `rating` (1-5 stars)
  - `image` (ImageField, optional)
  - `is_featured` (boolean)
  - `is_approved` (boolean)
  - `created_at`, `updated_at`

**API Endpoints:**
- `GET /api/testimonials/` - List approved testimonials (public)
- `POST /api/testimonials/` - Submit testimonial (public)
- `GET /api/testimonials/{id}/` - Get testimonial (public)
- Full CRUD for authenticated users

**Features:**
- Public submission
- Approval workflow
- Featured testimonials
- Rating system

#### 3.1.9 Newsletter (`newsletter` app)
**Model:** `NewsletterSubscription`
- **Fields:**
  - `email` (unique)
  - `name` (optional)
  - `subscribed_at`
  - `is_active` (boolean)
  - `subscribed_ip` (IP address, optional)

**API Endpoints:**
- `POST /api/newsletter/subscribe/` - Subscribe to newsletter (public)
- `POST /api/newsletter/unsubscribe/` - Unsubscribe (public)
- Admin endpoints for managing subscriptions

**Features:**
- IP address tracking
- Active/inactive status
- Email uniqueness validation

#### 3.1.10 Contact (`contact` app)
**Model:** `ContactMessage`
- **Fields:**
  - `name`, `email`, `subject`, `message`
  - `created_at`

**API Endpoints:**
- `POST /api/contact/` - Submit contact form (public)
- Admin endpoints for viewing messages

**Features:**
- Simple contact form submission
- Message storage

#### 3.1.11 Clients (`clients` app)
**Model:** `Client`
- **Fields:**
  - `name`, `logo` (ImageField, optional)
  - `industry`, `description`
  - `is_public` (boolean)
  - `created_at`, `updated_at`

**Model:** `Project` (client-specific, separate from main projects app)
- **Fields:**
  - `title`, `description`
  - `client` (ForeignKey)
  - `tech_stack` (comma-separated)
  - `repo_url`, `live_url` (optional)
  - `created_at`, `updated_at`

**Model:** `CaseStudy`
- **Fields:**
  - `title`
  - `client` (ForeignKey)
  - `problem`, `solution`, `result` (text fields)
  - `metrics` (JSONField)
  - `testimonial` (optional)
  - `is_public` (boolean)
  - `created_at`, `updated_at`

**API Endpoints:**
- Full CRUD for all models (authenticated)
- Public endpoints for public clients/projects/case studies

**Features:**
- Client logo management
- Public/private visibility control
- Case study metrics (JSON)
- Separate project model for client projects

#### 3.1.12 Search
**Endpoint:** `GET /api/search/`
- **Features:**
  - Global search across projects, blog posts, services
  - Returns aggregated results

---

### 3.2 Frontend Features

#### 3.2.1 Public Pages
- **Home** (`/`) - Landing page with hero section, stats, testimonials
- **About** (`/about`) - Company information, story, mission, vision, values
- **Projects** (`/projects`) - Portfolio showcase with filtering and search
- **Project Detail** (`/projects/:id`) - Individual project details
- **Blog** (`/blog`) - Blog listing with pagination
- **Blog Detail** (`/blog/:id`) - Individual blog post
- **Services** (`/services`) - Service offerings with illustrations
- **Service Detail** (`/services/:id`) - Individual service details
- **Clients** (`/clients`) - Client showcase (public clients only)
- **Case Studies** (`/case-studies`) - Case study showcase (public only)
- **Contact** (`/contact`) - Contact form
- **Pricing** (`/pricing`) - Pricing page
- **Search Results** (`/search`) - Global search results

#### 3.2.2 Authentication Pages
- **Login** (`/login`) - Email-based login
- **Register** (`/register`) - User registration
- **Forgot Password** (`/forgot-password`) - Password reset request
- **Reset Password** (`/reset-password/:uid/:token`) - Password reset confirmation

#### 3.2.3 Protected Pages
- **Dashboard** (`/dashboard`) - User dashboard (authenticated users)
- **Quotes** (`/quotes`) - User's quotes (authenticated users)

#### 3.2.4 Admin Pages (Superuser Only)
All admin pages use `AdminLayout` component with sidebar navigation:
- **Admin Dashboard** (`/admin`) - Overview dashboard
- **Admin Projects** (`/admin/projects`) - Full CRUD for projects
- **Admin Blog** (`/admin/blog`) - Full CRUD for blog posts
- **Admin Services** (`/admin/services`) - Full CRUD for services
- **Admin Contact** (`/admin/contact`) - View contact messages
- **Admin Testimonials** (`/admin/testimonials`) - Full CRUD for testimonials
- **Admin Newsletter** (`/admin/newsletter`) - Manage newsletter subscriptions
- **Admin Quotes** (`/admin/quotes`) - Full CRUD for quotes
- **Admin Invoices** (`/admin/invoices`) - Full CRUD for invoices with PDF download
- **Admin Users** (`/admin/users`) - Full CRUD for users
- **Admin Clients** (`/admin/clients`) - Full CRUD for clients
- **Admin Client Projects** (`/admin/client-projects`) - Full CRUD for client projects
- **Admin Case Studies** (`/admin/case-studies`) - Full CRUD for case studies
- **Admin About** (`/admin/about`) - Manage About Us content and values

#### 3.2.5 Frontend Components
- **Navbar** - Navigation with authentication state
- **SearchBar** - Global search functionality
- **AdminLayout** - Admin panel layout with sidebar
- **DataTable** - Reusable data table component
- **ConfirmDialog** - Confirmation dialog for delete actions
- **ProtectedRoute** - Route protection based on authentication/superuser status
- **Newsletter** - Newsletter subscription component
- **Testimonials** - Testimonial display component
- **TestimonialForm** - Testimonial submission form
- **AboutSection** - About section component
- **StatsSection** - Statistics display component

#### 3.2.6 Frontend Features
- **JWT Authentication** - Token-based auth with refresh
- **Image Upload** - Support for project, blog, testimonial images
- **Form Validation** - Client-side validation
- **Responsive Design** - Mobile-first Tailwind CSS
- **Error Handling** - User-friendly error messages
- **Loading States** - Loading indicators
- **Search Functionality** - Global search across content
- **Filtering & Sorting** - Filter and sort capabilities
- **Pagination** - Paginated results where applicable

---

## 4. User Roles & Permissions

### 4.1 Public Users (Unauthenticated)
**Can:**
- View public pages (Home, About, Projects, Blog, Services, Clients, Case Studies)
- Submit contact form
- Subscribe to newsletter
- Submit testimonials
- View approved testimonials
- Search content
- Register new account
- Request password reset

**Cannot:**
- Access admin panel
- Access dashboard
- Create/edit/delete content
- View quotes
- View invoices

### 4.2 Authenticated Users
**Can:**
- All public user capabilities
- Access dashboard
- View their own quotes
- Update their profile
- View approved testimonials

**Cannot:**
- Access admin panel
- Create/edit/delete content (except own profile)
- View other users' quotes
- View invoices

### 4.3 Superusers (Admin)
**Can:**
- All authenticated user capabilities
- Access admin panel
- Full CRUD on all models:
  - Projects, Blog Posts, Services
  - Testimonials, Newsletter Subscriptions
  - Quotes, Invoices
  - Users (create, edit, delete, manage permissions)
  - Clients, Client Projects, Case Studies
  - About Us content and Values
- View all contact messages
- Generate PDF invoices
- Mark invoices as paid
- Assign quotes to users
- Approve/reject testimonials
- Manage public/private visibility

**Permissions:**
- Django admin access (`/admin/`)
- React admin panel access (all `/admin/*` routes)
- All API endpoints (authenticated)

---

## 5. Current Limitations / Gaps

### 5.1 Known Limitations
1. **Database:** Currently using SQLite (not suitable for production)
2. **Email:** Console backend only (not sending real emails)
3. **File Storage:** Local filesystem only (no cloud storage integration)
4. **Image Optimization:** No automatic image resizing/optimization
5. **Search:** Basic search implementation (no advanced search features)
6. **Pagination:** Fixed page size (20 items) - not configurable
7. **Error Logging:** No centralized error logging system
8. **Analytics:** No analytics/tracking implementation
9. **Backup:** No automated backup system
10. **Caching:** No caching layer implemented

### 5.2 Partial Implementations
1. **Contact Form:** Submits but no email notification sent
2. **Newsletter:** Subscription works but no email campaigns
3. **Password Reset:** Email links generated but emails not sent (console only)
4. **Invoice PDF:** PDF generation exists but may need styling improvements
5. **Service Images:** Uses SVG illustrations, no actual image upload field in model

### 5.3 Missing Features
1. **Email Notifications:**
   - No email notifications for new contact messages
   - No email notifications for new quotes
   - No email notifications for invoice status changes
   - No newsletter email sending capability

2. **User Features:**
   - No user profile image upload
   - No user preferences/settings
   - No user activity tracking

3. **Content Management:**
   - No content versioning/history
   - No draft/publish workflow for blog posts
   - No scheduled publishing

4. **Business Features:**
   - No payment processing integration
   - No invoice payment tracking beyond status
   - No quote templates
   - No recurring invoices

5. **Security:**
   - No rate limiting
   - No CAPTCHA for public forms
   - No IP blocking/whitelisting

6. **Reporting:**
   - No analytics dashboard
   - No revenue reports
   - No user activity reports

---

## 6. Non-Functional Requirements

### 6.1 Security
**Implemented:**
- JWT authentication
- Password hashing (Django's default)
- CORS configuration
- CSRF protection (Django)
- SQL injection protection (Django ORM)
- XSS protection (React's default escaping)

**Not Implemented:**
- Rate limiting
- CAPTCHA
- IP blocking
- Security headers (HSTS, CSP)
- Input sanitization beyond Django defaults
- File upload validation (size, type)

### 6.2 Performance
**Current State:**
- No caching layer
- No CDN for static/media files
- No database query optimization (beyond Django defaults)
- No image optimization
- Pagination implemented (20 items per page)

**Recommendations:**
- Implement Redis caching
- Use CDN for media files
- Optimize database queries (select_related, prefetch_related)
- Implement image optimization
- Add database indexing

### 6.3 Scalability
**Current Limitations:**
- SQLite database (not scalable)
- Local file storage (not distributed)
- Single server architecture
- No load balancing

**For Production:**
- Migrate to PostgreSQL/MySQL
- Use cloud storage (AWS S3, etc.)
- Implement horizontal scaling
- Add load balancing

### 6.4 Reliability
**Current State:**
- No automated backups
- No health checks
- No monitoring
- No error tracking (Sentry, etc.)

**Recommendations:**
- Implement automated backups
- Add health check endpoints
- Integrate monitoring (New Relic, Datadog)
- Add error tracking

---

## 7. What Is NOT Implemented Yet

### 7.1 Email System
- ❌ Real email sending (currently console only)
- ❌ Email templates
- ❌ Email queue system
- ❌ Newsletter email campaigns
- ❌ Automated email notifications

### 7.2 Payment Processing
- ❌ Payment gateway integration (Stripe, PayPal, etc.)
- ❌ Payment tracking
- ❌ Recurring payments
- ❌ Payment history

### 7.3 Advanced Features
- ❌ Content scheduling
- ❌ Content versioning
- ❌ Multi-language support
- ❌ SEO optimization tools
- ❌ Social media integration
- ❌ Comments system for blog
- ❌ User roles beyond superuser/regular user
- ❌ Activity logging/audit trail
- ❌ File management system
- ❌ Document management

### 7.4 Integrations
- ❌ Third-party APIs
- ❌ Social login (Google, Facebook, etc.)
- ❌ Analytics integration (Google Analytics, etc.)
- ❌ CRM integration
- ❌ Accounting software integration

### 7.5 Mobile
- ❌ Mobile app (iOS/Android)
- ❌ Progressive Web App (PWA) features
- ❌ Mobile-specific optimizations

---

## 8. API Documentation

### 8.1 Authentication
All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

### 8.2 Base URL
- Development: `http://localhost:8000/api`
- Production: (configurable)

### 8.3 Common Response Formats
**Success:**
```json
{
  "id": 1,
  "field": "value"
}
```

**List Response (Paginated):**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

**Error:**
```json
{
  "detail": "Error message",
  "field_name": ["Field-specific error"]
}
```

### 8.4 Media URLs
Media files are served at: `http://localhost:8000/media/{path}`
- Projects: `/media/projects/`
- Blog: `/media/blog/`
- Testimonials: `/media/testimonials/`
- About: `/media/about/`
- Clients: `/media/clients/logos/`

---

## 9. Deployment Considerations

### 9.1 Environment Variables Required
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (False in production)
- `ALLOWED_HOSTS` - Allowed hostnames
- `DB_ENGINE` - Database engine
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `EMAIL_BACKEND` - Email backend
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_HOST_USER` - SMTP user
- `EMAIL_HOST_PASSWORD` - SMTP password
- `FRONTEND_URL` - Frontend URL for email links

### 9.2 Production Checklist
- [ ] Change `DEBUG = False`
- [ ] Set strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Migrate to PostgreSQL/MySQL
- [ ] Configure real email backend
- [ ] Set up static file serving (nginx/Apache)
- [ ] Configure media file serving
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up automated backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Review security settings
- [ ] Optimize database queries
- [ ] Set up CDN for media files

---

## 10. Development Setup

### 10.1 Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### 10.2 Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 10.3 Database
- Default: SQLite (`db.sqlite3`)
- Can be configured to PostgreSQL/MySQL via environment variables

---

## 11. File Structure

```
glowing-memory/
├── PathyCodeback/          # Django project settings
├── users/                  # User management app
├── projects/               # Projects app
├── blog/                   # Blog app
├── services/               # Services app
├── quotes/                 # Quotes app
├── invoices/               # Invoices app
├── about/                  # About Us app
├── testimonials/           # Testimonials app
├── newsletter/             # Newsletter app
├── contact/                # Contact app
├── clients/                # Clients app
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
├── media/                  # Uploaded media files
├── staticfiles/            # Collected static files
└── db.sqlite3             # SQLite database
```

---

## 12. Notes

- This document reflects the **current state** of the application as of January 2026
- All features listed are **implemented and functional**
- Features marked as "Not Implemented" are **planned or future enhancements**
- The system is designed to be **extensible** - new features can be added following existing patterns
- Admin panel provides **full CRUD** capabilities matching Django admin functionality
- Frontend and backend are **decoupled** - can be deployed separately

---

**Document Status:** Complete  
**Last Updated:** January 2026  
**Maintained By:** Development Team
