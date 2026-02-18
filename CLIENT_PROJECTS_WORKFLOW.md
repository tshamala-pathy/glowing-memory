# Client Projects System Documentation

## Overview

This document explains the complete Client Projects system in PathyCode. The system automatically creates client projects when invoices are paid, links projects to quotes and invoices, and provides both public and private project visibility.

---

## 📘 Auto-create Client on Registration

When a new user **registers** (signs up), the system automatically creates a **Client** profile linked to that user:

1. **User signs up** (e.g. via `/api/users/register/`)
2. **System creates** a `Client` instance with `user` = the new user (OneToOne)
3. **Client name** is set from the user’s full name, email, or username
4. **Client portal works immediately** after login: quotes, invoices, and projects are scoped by `request.user.client_profile`

**Implementation:** `clients.signals.create_client_profile_for_user` (runs on `User` `post_save` when `created=True`). The registration and login API responses include `client_profile: { id, name }` so the frontend can use the client id without an extra request.

---

## 📘 Restrict Client Portal Access (Step 5)

Only **authenticated users** may access the Client Portal (quotes, invoices, projects). Unauthenticated users receive **401 Unauthorized** with a clear message so the frontend can redirect to login or show a permission message.

- **Portal endpoints** (require login): Quotes list/retrieve, Invoices list/retrieve/pdf, Projects list/retrieve and `my_projects`. Without a valid JWT, the API returns `401` with body: `{ "detail": "Authentication required. Please log in to access this resource." }`.
- **Public endpoints** (no login): Quote **create** (submit a quote request), Projects **public** list (`GET /api/clients/projects/public/` for the portfolio page).
- **Frontend:** On 401 from any portal endpoint, redirect to login or show “Please log in to access the Client Portal.”

---

## 📘 Filter Client Portal Data (Step 6)

All Client Portal views fetch data using the logged-in user's Client profile. A user sees only their own data; no other client's data is ever visible.

- **Quotes:** Filtered by `client = request.user.client_profile` (with fallback to `client_email` for legacy quotes). List/retrieve return only that user's quotes.
- **Invoices:** Same: `client = request.user.client_profile` or legacy `client_email`. Only their invoices.
- **Projects:** Filtered by `client = request.user.client_profile` plus public projects. They never see another client's private projects.
- **Client profile:** Non-admin users only see their own Client record (list/retrieve); staff/superuser see all.

Superusers (and staff for projects/clients) still see all data for admin purposes.

---

## 📘 Client Portal UI (Step 7)

The frontend Client Portal (`/portal` and My Projects `/my-projects`) is wired so:

- **My Quotes** shows only the logged-in client's quotes (API: `GET /api/quotes/`).
- **My Invoices** shows only the logged-in client's invoices (API: `GET /api/invoices/`).
- **My Projects** shows only the logged-in client's projects (API: `GET /api/clients/projects/my_projects/`).

If a section has no data, a friendly **empty-state** is shown (icon, short heading, and message). For example: "No quotes yet" with a link to request a quote; "No invoices yet" explaining they appear after a quote is approved; "No projects yet" explaining projects are created when an invoice is paid.

---

## 📘 Admin-side visibility (Step 8)

Admins can:

- **See all Clients** — Django Admin: Clients list; Frontend Admin: Clients page. Staff/superuser get the full list via the API.
- **See related Quotes, Invoices, and Projects per Client** — In Django Admin, open a Client: inlines show that client’s Quotes, Invoices, and Projects (with links to edit each). In the frontend admin, Quotes, Invoices, and Client Projects pages have an **All Clients** / **Filter by client** dropdown so admins can filter by client.
- **Respond to Quotes** — Django Admin: on the Quote change form, set **Admin response**, then use **Send Response Email** (or save with status **Replied** to send automatically). Frontend Admin: open a quote, set **Admin response**, then use **Send Response** (and **Approve** / **Reject** as needed).

---

## 📘 Documentation (Step 9)

A **developer guide** explains the design for future developers:

- **`docs/USER_AND_CLIENT_GUIDE.md`** — Single place for:
  - **Difference between User and Client** — User = authentication only; Client = business/customer entity that owns quotes, invoices, projects.
  - **How they are linked** — OneToOne: `Client.user`, `user.client_profile`; Client is auto-created on registration.
  - **How data flows in the Client Portal** — User → Client → filtered quotes/invoices/projects; backend filters by `request.user.client_profile`; frontend calls portal APIs and displays results.
  - **Why this architecture** — Clear separation of concerns, single ownership model, portal works after signup, scalable and secure.

The guide is written to be simple and easy to follow. See also `docs/RESPONSIBILITIES.md` for a short summary and `docs/AUTHENTICATION.md` for JWT/login.

---

## 📘 Business Workflow Overview

The complete business workflow from quote submission to project completion:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SUBMITS QUOTE                      │
│              (Public form at /request-quote)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN REVIEWS & APPROVES QUOTE                 │
│  • Admin sets status to "Approved"                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN GENERATES INVOICE                         │
│  • Invoice created from approved quote                       │
│  • Invoice status: Draft → Sent                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT PAYS INVOICE                             │
│  • Admin marks invoice as "Paid"                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         AUTOMATIC PROJECT CREATION (Signal)                  │
│  • Project automatically created                             │
│  • Linked to: Client (business entity), Quote, Invoice      │
│  • Status: "pending"                                         │
│  • Visibility: Private (is_public = false)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              PROJECT DEVELOPMENT                             │
│  • Admin updates project status                              │
│  • Admin adds screenshots, tech stack, URLs                 │
│  • Admin can make project public                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📘 Quote → Invoice → Project Lifecycle

### Stage 1: Quote Submission
- **Who**: Client (anyone, public access)
- **Action**: Submit quote request via `/request-quote`
- **Result**: Quote created with status `Pending`
- **Email**: Confirmation sent to client, notification to admin

### Stage 2: Quote Approval
- **Who**: Admin only
- **Action**: Review quote, set `estimated_amount`, set status to `Approved`
- **Result**: Quote ready for invoice generation
- **Email**: Response sent to client (if admin responds)

### Stage 3: Invoice Generation
- **Who**: Admin only
- **Action**: Create invoice from approved quote
- **Result**: Invoice created, linked to quote (OneToOne)
- **Status**: `Draft` → `Sent`
- **Email**: Invoice sent to client

### Stage 4: Payment
- **Who**: Client pays, Admin marks as paid
- **Action**: Admin sets invoice status to `Paid`
- **Result**: **Project automatically created** (via Django signal)
- **Project Fields**:
  - `name` ← `quote.project_title`
  - `description` ← `quote.project_description`
  - `client` ← Client (business entity) from quote.client or quote.client_email
  - `quote` ← The approved quote
  - `invoice` ← The paid invoice
  - `status` ← `'pending'`
  - `tech_stack` ← `quote.service_type` (if available)
  - `is_public` ← `False` (default: private)

### Stage 5: Project Development
- **Who**: Admin (and client can view)
- **Action**: Update project details, add screenshots, change status
- **Status Flow**: `pending` → `in_progress` → `completed`
- **Optional**: Make project public (`is_public = True`)

---

## 📘 Public vs Private Projects

### Public Projects (`is_public = True`)

**Visibility:**
- ✅ Visible to **everyone** (including non-authenticated users)
- ✅ Displayed on `/public-projects` page
- ✅ Shown in public API endpoint: `/api/clients/projects/public/`

**What's Shown:**
- Project name
- Description
- Tech stack
- Screenshots (if available)
- Status (pending, in_progress, completed)
- Live URL (if available)
- Repository URL (if available)

**What's Hidden:**
- ❌ Client email
- ❌ Invoice number
- ❌ Invoice details
- ❌ Quote details
- ❌ Any sensitive client information

**Use Cases:**
- Portfolio showcase
- Marketing/public relations
- Demonstrating capabilities
- Building trust with potential clients

### Private Projects (`is_public = False`)

**Visibility:**
- ✅ Only visible to:
  - The project's client (the user who owns the project)
  - Admin users (can see all projects)
- ❌ **Not** visible to:
  - Other clients
  - Non-authenticated users
  - Public API endpoints

**What's Shown (to client):**
- All project details
- Related quote information
- Related invoice information
- Full tech stack
- All screenshots
- Status and timestamps

**Use Cases:**
- Internal projects
- Projects with sensitive information
- Projects not ready for public display
- Client-specific work

---

## 📘 Client Permissions vs Admin Permissions

### Client Permissions

**What Clients Can Do:**
- ✅ View their own projects (both public and private)
- ✅ See project status, description, tech stack
- ✅ View related quote and invoice information
- ✅ Access project via `/my-projects` page
- ✅ View public projects (all public projects)

**What Clients Cannot Do:**
- ❌ Create projects (automatic only)
- ❌ Edit projects
- ❌ Delete projects
- ❌ Change project status
- ❌ Make projects public/private
- ❌ View other clients' private projects
- ❌ Access admin panel

**API Access (all require authentication for Client Portal):**
- `GET /api/clients/projects/` - Returns only their own projects + public projects (401 if not logged in)
- `GET /api/clients/projects/{id}/` - Only if they own it or it's public (401 if not logged in)
- `GET /api/clients/projects/public/` - Public portfolio; no login required

### Admin Permissions

**What Admins Can Do:**
- ✅ View **all** projects (public and private)
- ✅ Create projects manually (if needed)
- ✅ Edit any project
- ✅ Delete projects
- ✅ Change project status
- ✅ Toggle public/private visibility
- ✅ Add/remove screenshots
- ✅ Update tech stack, URLs, description
- ✅ Link/unlink quotes and invoices
- ✅ Access admin panel (`/admin/client-projects`)

**API Access:**
- `GET /api/clients/projects/` - Returns all projects
- `POST /api/clients/projects/` - Create new project
- `PUT /api/clients/projects/{id}/` - Update any project
- `DELETE /api/clients/projects/{id}/` - Delete any project

---

## 📘 Automation Triggers

### Automatic Project Creation

**Trigger:** Invoice status changes from non-`Paid` to `Paid`

**Implementation:** Django `pre_save` signal on `Invoice` model

**Location:** `clients/signals.py`

**Code:**
```python
@receiver(pre_save, sender=Invoice)
def create_project_on_invoice_paid(sender, instance, **kwargs):
    # Only process if status is changing TO "Paid"
    if old_status != 'Paid' and new_status == 'Paid':
        # Find client user by email
        client_user = User.objects.get(email=quote.client_email)
        
        # Create project
        project = Project.objects.create(
            name=quote.project_title,
            description=quote.project_description,
            client=client_user,
            quote=quote,
            invoice=instance,
            status='pending',
            tech_stack=quote.service_type or '',
            is_public=False,
        )
```

**Conditions:**
- ✅ Invoice must have a linked quote
- ✅ Quote must have a `client_email` that matches a User
- ✅ Project must not already exist for this invoice
- ✅ Invoice status must change to `Paid` (not just be `Paid`)

**What Happens:**
1. Signal fires when admin sets invoice status to `Paid`
2. System finds the User matching `quote.client_email`
3. System creates a new `Project` object
4. Project is linked to client, quote, and invoice
5. Project status is set to `pending`
6. Project is private by default (`is_public = False`)

**Error Handling:**
- If user doesn't exist: Warning logged, project not created
- If project already exists: Warning logged, no duplicate created
- If quote is missing: Warning logged, project not created

### Manual Project Creation

**When:** Admin needs to create a project manually (e.g., for testing, legacy projects)

**How:**
1. Django Admin: `/admin/clients/project/add/`
2. React Admin Panel: `/admin/client-projects` → "Add Project"
3. API: `POST /api/clients/projects/`

**Required Fields:**
- `name` - Project name
- `description` - Project description
- `client` - User (the client)

**Optional Fields:**
- `status` - Default: `pending`
- `quote` - Link to related quote
- `invoice` - Link to related invoice
- `tech_stack` - Comma-separated technologies
- `screenshots` - JSON array of image URLs
- `repo_url` - GitHub repository URL
- `live_url` - Live demo URL
- `is_public` - Default: `False`

---

## 📘 Project Model Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | CharField | Yes | Project name/title |
| `description` | TextField | Yes | Detailed project description |
| `client` | ForeignKey → User | Yes | The client (user) who owns this project |
| `status` | CharField | Yes | Project status (pending, in_progress, completed) |

### Relationship Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quote` | ForeignKey → Quote | No | The quote this project is based on |
| `invoice` | ForeignKey → Invoice | No | The invoice that triggered project creation |

### Technical Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tech_stack` | CharField | No | Comma-separated list of technologies |
| `screenshots` | JSONField | No | Array of screenshot/image URLs |
| `repo_url` | URLField | No | GitHub repository URL |
| `live_url` | URLField | No | Live demo URL |

### Visibility Field

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_public` | BooleanField | No | If `True`, visible to non-authenticated users |

### Timestamps

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | DateTimeField | Auto-set on creation |
| `updated_at` | DateTimeField | Auto-updated on save |

---

## 📘 API Endpoints

### Public Endpoints (No Authentication Required)

#### `GET /api/clients/projects/public/`
Get all public projects.

**Response:**
```json
[
  {
    "id": 1,
    "name": "E-Commerce Platform",
    "description": "Full-stack e-commerce solution...",
    "status": "completed",
    "tech_stack": ["React", "Django", "PostgreSQL"],
    "screenshots": ["/media/projects/screenshot1.jpg"],
    "repo_url": "https://github.com/...",
    "live_url": "https://example.com",
    "is_public": true,
    "created_at": "2026-01-20T10:00:00Z"
  }
]
```

**Filters:**
- `?search=keyword` - Search by name, description, tech stack
- `?status=completed` - Filter by status
- `?ordering=-created_at` - Order by creation date

### Authenticated Endpoints

#### `GET /api/clients/projects/`
Get projects for authenticated user.

**For Regular Users:**
- Returns their own projects + public projects

**For Admin Users:**
- Returns all projects

**Filters:**
- `?client={user_id}` - Filter by client
- `?status={status}` - Filter by status
- `?is_public={true/false}` - Filter by visibility
- `?search={keyword}` - Search

#### `GET /api/clients/projects/{id}/`
Get project details.

**Access Control:**
- Public projects: Anyone can view
- Private projects: Only owner or admin can view

#### `POST /api/clients/projects/` (Admin Only)
Create a new project.

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Project description...",
  "client": 1,
  "status": "pending",
  "quote": 5,
  "invoice": 10,
  "tech_stack": "React, Django, PostgreSQL",
  "repo_url": "https://github.com/...",
  "live_url": "https://example.com",
  "is_public": false,
  "screenshots": []
}
```

#### `PUT /api/clients/projects/{id}/` (Admin Only)
Update a project.

#### `DELETE /api/clients/projects/{id}/` (Admin Only)
Delete a project.

---

## 📘 Frontend Pages

### Public Projects Page

**Route:** `/public-projects`

**Access:** Public (no authentication required)

**Features:**
- Display all public projects
- Search and filter by status
- Show project cards with images, tech stack, status
- Links to live demo and repository

**Component:** `frontend/src/pages/PublicProjects.js`

### Client Projects Page

**Route:** `/my-projects`

**Access:** Protected (authentication required)

**Features:**
- Display projects for logged-in client
- Show both public and private projects
- Search and filter by status
- Show quote and invoice information
- Links to live demo and repository

**Component:** `frontend/src/pages/ClientProjects.js`

### Admin Projects Page

**Route:** `/admin/client-projects`

**Access:** Admin only

**Features:**
- Full CRUD for projects
- View all projects
- Create, edit, delete projects
- Link projects to quotes and invoices
- Toggle public/private visibility
- Manage screenshots, tech stack, URLs

**Component:** `frontend/src/pages/admin/AdminClientProjects.js`

---

## 📘 Business Rules & Validation

### Project Creation Rules

1. ✅ Projects are **automatically created** when invoice status changes to `Paid`
2. ✅ Projects can be **manually created** by admin users
3. ✅ Projects **must** have a client (User)
4. ✅ Projects **can** be linked to a quote and invoice
5. ✅ If invoice is provided, it must be `Paid` (enforced in `clean()` method)

### Project Visibility Rules

1. ✅ Public projects (`is_public = True`):
   - Visible to everyone (including non-authenticated users)
   - Shown on `/public-projects` page
   - Accessible via `/api/clients/projects/public/`

2. ✅ Private projects (`is_public = False`):
   - Only visible to project owner (client) and admin users
   - Not shown on public pages
   - Not accessible via public API

### Access Control Rules

1. ✅ **Clients** can only see:
   - Their own projects (public or private)
   - All public projects

2. ✅ **Admins** can see:
   - All projects (public and private)

3. ✅ **Non-authenticated users** can only see:
   - Public projects

### Data Privacy Rules

1. ✅ Public projects **must not** expose:
   - Client email
   - Invoice number
   - Invoice details
   - Quote details
   - Any sensitive client information

2. ✅ Serializer (`ProjectSerializer`) automatically filters sensitive data:
   - Removes `client_email` for non-owners
   - Removes `invoice_number` for non-owners
   - Removes `invoice` field for non-owners

---

## 📘 Testing Checklist

### Automatic Project Creation
- [ ] Invoice status changes to `Paid` → Project created
- [ ] Project linked to correct client (User)
- [ ] Project linked to quote and invoice
- [ ] Project status is `pending`
- [ ] Project is private by default
- [ ] Project name and description copied from quote

### Public Projects
- [ ] Public projects visible on `/public-projects` page
- [ ] Public projects accessible without authentication
- [ ] Sensitive data hidden from public view
- [ ] Search and filter work correctly

### Client Projects
- [ ] Clients can view their own projects at `/my-projects`
- [ ] Clients see both public and private projects
- [ ] Clients cannot see other clients' private projects
- [ ] Quote and invoice information visible to client

### Admin Projects
- [ ] Admins can view all projects
- [ ] Admins can create projects manually
- [ ] Admins can edit any project
- [ ] Admins can toggle public/private visibility
- [ ] Admins can link projects to quotes and invoices

### Access Control
- [ ] Non-authenticated users can only see public projects
- [ ] Clients can only see their own projects + public projects
- [ ] Admins can see all projects
- [ ] API endpoints enforce correct permissions

---

## 📘 Troubleshooting

### Project Not Created After Invoice Payment

**Symptoms:**
- Invoice marked as `Paid` but no project created

**Possible Causes:**
1. User with matching email doesn't exist
2. Signal not registered (check `clients/apps.py`)
3. Invoice doesn't have a linked quote
4. Project already exists for this invoice

**Solutions:**
1. Check Django logs for signal warnings
2. Verify `clients/apps.py` imports signals in `ready()` method
3. Ensure invoice has a linked quote
4. Check if project already exists: `Project.objects.filter(invoice=invoice)`

### Client Cannot See Their Projects

**Symptoms:**
- Client logged in but sees no projects at `/my-projects`

**Possible Causes:**
1. Projects not linked to correct user
2. Client email doesn't match project's client
3. API permission issue

**Solutions:**
1. Verify project's `client` field matches the logged-in user
2. Check API response: `GET /api/clients/projects/`
3. Verify user authentication token is valid

### Public Projects Not Showing

**Symptoms:**
- Projects marked as `is_public = True` but not visible on `/public-projects`

**Possible Causes:**
1. API endpoint not working
2. Frontend not calling correct endpoint
3. Projects not actually marked as public

**Solutions:**
1. Test API: `GET /api/clients/projects/public/`
2. Check browser console for errors
3. Verify `is_public = True` in database

---

## 📘 Future Enhancements

Potential improvements:

1. **Project Templates**: Pre-configured project templates
2. **Project Milestones**: Track project progress with milestones
3. **Client Collaboration**: Allow clients to add comments/feedback
4. **File Uploads**: Direct screenshot uploads (not just URLs)
5. **Project Analytics**: Track project views, engagement
6. **Project Categories**: Organize projects by category/type
7. **Project Timeline**: Visual timeline of project development
8. **Client Notifications**: Notify clients when project status changes
9. **Project Reviews**: Allow clients to review completed projects
10. **Integration with Case Studies**: Link projects to case studies

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Status**: Production Ready
