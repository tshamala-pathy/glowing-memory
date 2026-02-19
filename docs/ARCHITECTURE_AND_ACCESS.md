# Architecture & Access Guide

This document explains the application's design decisions: why there is no User Dashboard, how the Profile page serves as the main hub, data visibility rules, and the authentication flow.

---

## 1. Why There Is No User Dashboard

The application intentionally **does not have a separate User Dashboard**. This is a design decision to simplify the user experience and reduce redundancy.

### Design Rationale

- **Single entry point:** After login or registration, users are redirected to the **Profile page** (`/profile`), which serves as their main hub. There is no intermediate "Dashboard" page.
- **Avoid duplication:** A separate Dashboard would duplicate the same data (quotes, invoices, projects, messages) that the Profile page already displays. Consolidating into one place reduces maintenance and confusion.
- **Clear hierarchy:** The Profile page provides tabbed access to Overview, Messages, Quotes, Invoices, Projects, Testimonials, and Account Settings. This replaces the need for a separate Dashboard.
- **Legacy route:** The path `/dashboard` redirects to `/profile` for backward compatibility with any bookmarks or links.

### What Was Removed

- The standalone User Dashboard component (`Dashboard.js`) was removed.
- The `/dashboard` route now performs a redirect to `/profile`.

---

## 2. Profile Page as the Main Hub

The **Profile page** (`/profile`) is the primary destination for authenticated users. It is the central place where users manage their account and view their data.

### Features

| Tab | Content |
|-----|---------|
| **Overview** | Personal details, client details, summary counts, quick links (Portal, My Projects, Request Quote, Contact, Admin if superuser) |
| **My Messages** | Contact messages sent by the user |
| **My Quotes** | Quote requests and their status |
| **My Invoices** | Invoices and payment status |
| **My Projects** | Active and completed projects |
| **Testimonials** | User-submitted testimonials and approval status |
| **Account Settings** | Account created date, last login, profile info |

### Data Source

The Profile page fetches all data from a **single API endpoint**:

- **`GET /api/profile/`** — Returns `user`, `client`, `quotes`, `invoices`, `projects`, `messages`, `testimonials` in one response.

This avoids multiple API calls and keeps the page fast and consistent.

### Post-Login / Post-Registration Flow

1. User logs in or registers.
2. Frontend receives JWT tokens and stores them.
3. User is **redirected to `/profile`** (not to a Dashboard).
4. Profile page loads and fetches data from `/api/profile/`.
5. User sees their overview and can navigate via tabs.

---

## 3. Data Visibility Rules

Data visibility is determined by **authentication status** and **user type**. The backend enforces these rules; the frontend only displays what the API returns.

### Unauthenticated Users

| Data | Visibility |
|------|------------|
| Public pages (Home, About, Projects, Services, Contact, etc.) | Full access |
| Public projects (portfolio) | Full access |
| Public testimonials | Full access |
| Quotes, invoices, projects (own data) | **No access** — redirected to login |
| Profile, messages, account settings | **No access** — redirected to login |
| Admin panel | **No access** — redirected to login |

### Authenticated Users (Non-Admin)

| Data | Visibility |
|------|------------|
| All public data | Full access |
| **Own** quotes, invoices, projects | Full access (filtered by `client_profile`) |
| **Own** contact messages | Full access |
| **Own** testimonials | Full access |
| Other users' data | **No access** |
| Admin panel | **No access** — redirected to profile |

### Superusers

| Data | Visibility |
|------|------------|
| All of the above | Full access |
| Admin panel (`/admin/*`) | Full access |
| All quotes, invoices, projects, users, clients | Full access (no client filter) |

### Backend Enforcement

- **Quotes:** `Quote.objects.filter(client=profile)` or by `client_email` for legacy records.
- **Invoices:** `Invoice.objects.filter(client=profile)` or by `client_email`.
- **Projects:** `Project.objects.filter(client=profile)` for "my projects."
- **Messages:** `ContactMessage.objects.filter(client=profile)` or by email.
- **Testimonials:** `Testimonial.objects.filter(client=profile)` for "my testimonials."

The `client` (or `profile`) is always derived from `request.user.client_profile`. Staff/superusers may bypass these filters in admin endpoints.

---

## 4. Authentication Flow

### Registration

1. User submits email, password, first_name, last_name to `POST /api/users/register/`.
2. Backend creates `CustomUser` and a linked `Client` (via signal).
3. Backend returns JWT `access` and `refresh` tokens plus `user` and `client_profile`.
4. Frontend stores tokens in `localStorage`.
5. Frontend fetches user via `GET /api/users/profile/` (lightweight, for AuthContext).
6. **User is redirected to `/profile`.**

### Login

1. User submits email and password to `POST /api/users/login/`.
2. Backend validates credentials and returns JWT tokens plus user data.
3. Frontend stores tokens in `localStorage`.
4. Frontend fetches user via `GET /api/users/profile/`.
5. **User is redirected to `/profile`.**

### Token Usage

- **Access token:** Sent in `Authorization: Bearer <token>` on every API request.
- **Refresh token:** Used when access token expires (401); interceptor in `api.js` handles refresh automatically.
- **On refresh failure:** User is logged out and redirected to `/login`.

### Route Protection

| Route | Protection | Redirect if Unauthorized |
|-------|------------|--------------------------|
| `/profile`, `/portal`, `/my-projects`, etc. | `requireAuth={true}` | → `/login` |
| `/admin`, `/admin/*` | `requireSuperuser={true}` | → `/profile` |
| `/dashboard` | Redirect | → `/profile` |

### API Endpoints by Auth

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/users/profile/` | Yes | Lightweight user data (AuthContext) |
| `GET /api/profile/` | Yes | Full profile (user, client, quotes, invoices, projects, messages, testimonials) |
| `GET /api/quotes/`, `/invoices/`, etc. | Yes | Scoped to user's client |
| Admin endpoints | Superuser | Full CRUD |

---

## Related Documentation

- **`docs/PUBLIC_CLIENT_ADMIN_ACCESS.md`** — Access control summary and route tables
- **`docs/AUTHENTICATION.md`** — JWT, token refresh, AuthContext
- **`docs/USER_AND_CLIENT_GUIDE.md`** — User vs Client, data flow, backend filtering
