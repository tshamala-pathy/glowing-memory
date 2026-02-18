# Public Pages, Client Portal, and Admin Dashboard

This document describes access control: **Public**, **Profile & Client Portal** (authenticated), and **Admin Dashboard** (superuser).

**See also:** `docs/ARCHITECTURE_AND_ACCESS.md` — Why there is no User Dashboard, Profile as main hub, data visibility rules, and authentication flow.

## Access Control Summary

| User type | Can access | Redirect when accessing protected |
|-----------|------------|-----------------------------------|
| Unauthenticated | Public pages only | → `/login` |
| Authenticated | Profile, history, private projects, invoices | — |
| Superuser | All of the above + Admin | — |

---

## 1. Public Pages (no authentication)

Unauthenticated users see only these. No login required.

### Frontend routes (no `ProtectedRoute`)

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About Us |
| `/projects` | Portfolio projects list |
| `/projects/:id` | Portfolio project detail |
| `/services` | Services list |
| `/services/:id` | Service detail |
| `/contact` | Contact form |
| `/pricing` | Pricing |
| `/requirements` | Requirements (quote) |
| `/request-quote` | Quote request form |
| `/quote-success` | Quote success |
| `/public-projects` | Public client projects (portfolio) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth pages |

### Backend API (read-only public)

- **About:** `GET /api/about/` — `AllowAny`
- **Projects (portfolio):** `GET /api/projects/`, `GET /api/projects/:id/` — `AllowAny`
- **Services:** `GET /api/services/`, `GET /api/services/:id/` — `AllowAny`
- **Testimonials:** `GET /api/testimonials/`, `GET /api/testimonials/:id/` — `AllowAny`
- **Contact:** `POST /api/contact/` (submit message) — `AllowAny`

Write operations (create/update/delete) on services, testimonials, and portfolio projects require authentication or superuser as configured in the respective ViewSets.

---

## 2. Profile & Client Portal (authentication required)

Only authenticated users can access these. Unauthenticated users are redirected to `/login` when accessing these routes.

**Authenticated users can:** view their profile, view their history (messages, quotes, invoices, testimonials), view private projects and invoices. Data is scoped to their Client.

### Frontend routes (`ProtectedRoute requireAuth={true}`)

| Route | Page |
|-------|------|
| `/portal` | Client Portal (my quotes, invoices, projects) |
| `/my-projects` | My Projects (client’s projects) |
| `/profile` | Profile (main hub: overview, messages, quotes, invoices, projects, testimonials, settings) |
| `/blog`, `/blog/:id` | Blog |
| `/search` | Search |
| `/clients` | Clients list |
| `/case-studies` | Case studies |

### Backend API

- **Quotes:** `GET /api/quotes/` — returns only the authenticated user’s Client’s quotes.
- **Invoices:** `GET /api/invoices/`, `GET /api/invoices/:id/pdf/` — only that Client’s invoices.
- **Client projects:** `GET /api/clients/projects/`, `GET /api/clients/projects/my_projects/` — only that Client’s projects (plus public projects where applicable).

All other Client Portal APIs require `IsAuthenticated` and filter by `request.user.client_profile` (see `docs/USER_AND_CLIENT_GUIDE.md`).

---

## 3. Admin Dashboard (superuser only)

Only superusers can access admin routes. Used to manage content, users, quotes, invoices, and client projects.

### Frontend routes (`ProtectedRoute requireSuperuser={true}`)

All routes under `/admin/*`, for example:

- `/admin` — Admin dashboard
- `/admin/projects` — Portfolio projects
- `/admin/blog`, `/admin/services`, `/admin/contact`, `/admin/testimonials`, `/admin/newsletter`
- `/admin/quotes`, `/admin/invoices`, `/admin/users`, `/admin/clients`, `/admin/client-projects`, `/admin/case-studies`, `/admin/about`

### Backend API

- Admin ViewSets use `IsSuperuser` (or equivalent) for create/update/delete.
- Services and testimonials: list/retrieve are public; create/update/delete are superuser-only.
- Quotes, invoices, users, clients, client projects, etc.: admin endpoints are restricted to superuser (or staff where configured).

---

## Summary

| Tier | Who | Examples |
|------|-----|----------|
| **Public** | Everyone | About, Projects, Services, Testimonials, Contact, Pricing |
| **Profile & Client Portal** | Logged-in users (with Client profile) | Profile (main hub), Portal, My Projects, Blog |
| **Admin Dashboard** | Superusers | All `/admin/*` pages and admin APIs |

**Note:** There is no separate User Dashboard. The Profile page (`/profile`) is the main hub after login. The `/dashboard` route redirects to `/profile`.

---

**See also:** `docs/ARCHITECTURE_AND_ACCESS.md` (Profile as hub, data visibility, auth flow), `docs/USER_AND_CLIENT_GUIDE.md` (User vs Client, data flow), `CLIENT_PROJECTS_WORKFLOW.md` (business workflow).
