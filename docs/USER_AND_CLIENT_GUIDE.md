# User vs Client: Developer Guide

This guide explains the difference between **User** and **Client**, how they are linked, how data flows in the Client Portal, and why this architecture is used. It is written for developers who need to work on or extend the system.

---

## 1. What is the difference between User and Client?

### User (authentication only)

- **What it is:** The person who logs in. Stored in Django’s `AUTH_USER_MODEL` (e.g. `CustomUser` in the `users` app).
- **Used for:**
  - **Authentication** — who is logged in (login, JWT, session).
  - **Authorization** — permissions (`is_staff`, `is_superuser`) and role-based access.
  - **Profile** — name, email, etc., for the person using the system.
- **Not used for:** Representing the “customer” or “client” in a business sense. The User is the *account*; it is not the entity that “owns” quotes, invoices, or projects in domain terms.

### Client (business / customer entity)

- **What it is:** The customer or business that owns quotes, invoices, and projects. Stored in the `Client` model in the `clients` app.
- **Used for:**
  - **Ownership** — quotes, invoices, and projects **belong to** a Client (each has a `client` ForeignKey to `Client`).
  - **Business identity** — company name, logo, industry, etc.
  - **Portal scope** — “this user sees data for this Client” is determined by linking a User to a Client.
- **Not used for:** Login or password. Login is always via User.

### Quick comparison

| | User | Client |
|---|------|--------|
| **Purpose** | Who can log in and what they can do | Which customer’s data (quotes, invoices, projects) |
| **Model** | `users.CustomUser` (AUTH_USER_MODEL) | `clients.Client` |
| **Example** | john@company.com logs in | “Acme Corp” has 3 quotes and 2 projects |
| **Used for** | Auth, permissions, profile | Ownership of business data |

---

## 2. How are User and Client linked?

- **Link type:** One-to-one. Each User has **at most one** Client profile; each Client is linked to **at most one** User.
- **In the model:**
  - `Client` has: `user = OneToOneField(AUTH_USER_MODEL, ..., related_name='client_profile')`.
  - So: `user.client_profile` → the Client for that user (if any), and `client.user` → the User for that client (if any).
- **When is the link created?**
  - On **user registration**, a Client is created automatically and linked to the new User (see `clients.signals.create_client_profile_for_user`). So after signup, `request.user.client_profile` exists and the Client Portal can work immediately.
- **In code:**
  - To get the Client for the logged-in user: `request.user.client_profile` (or `getattr(request.user, 'client_profile', None)`).
  - To check if the current user “is” that client: `request.user == some_client.user`.

---

## 3. How does data flow in the Client Portal?

The Client Portal is the set of features where a logged-in user sees **only their own** quotes, invoices, and projects. Data flow is: **User → Client → business data**.

### Step-by-step flow

1. **User logs in**  
   Frontend stores JWT; each API request sends the token. Backend identifies the user as `request.user`.

2. **Resolve the Client**  
   Backend uses the User’s linked Client:  
   `client = request.user.client_profile`  
   (Created on registration if it didn’t exist.)

3. **Filter business data by Client**  
   - **Quotes:** `Quote.objects.filter(client=client)` (with fallback for legacy quotes by `client_email`).
   - **Invoices:** `Invoice.objects.filter(client=client)` (with same kind of fallback).
   - **Projects:** `Project.objects.filter(client=client)` for “my projects”; list view can also include public projects.

4. **API responses**  
   Only the quotes, invoices, and projects that belong to that Client are returned. The frontend does not need to filter by client; the backend already did.

5. **Frontend**  
   - **Portal page** (`/portal`): Fetches `/api/quotes/`, `/api/invoices/`, `/api/clients/projects/my_projects/`. Each endpoint returns only that user’s Client data.
   - **My Projects** (`/my-projects`): Uses `/api/clients/projects/my_projects/` (same filtering).

### Where filtering happens

- **Backend (required):** All Client Portal APIs filter by `request.user.client_profile` (or equivalent) in the view’s `get_queryset()`. Never rely on the frontend to restrict data.
- **Frontend:** Displays what the API returns; no extra “filter by client” logic needed for security.

### Who sees what

- **Non–staff users:** Only data for their own Client (their `client_profile`). Unauthenticated users get 401 on portal endpoints (or use public endpoints only, e.g. public projects).
- **Staff / superuser:** Can see all clients and all data (used for admin and support).

---

## 4. Why is this architecture used?

- **Clear separation of concerns**  
  - **User** = identity and access (auth only).  
  - **Client** = business entity that owns data.  
  This avoids overloading “User” with both “who logs in” and “which customer,” which gets confusing when you have multiple contacts per customer or B2B scenarios.

- **Single place for “who owns this?”**  
  Quotes, invoices, and projects all point to **Client**. Access control is “does the current User’s Client own this?” So ownership and permissions stay consistent and easy to reason about.

- **Portal works right after signup**  
  Because a Client is created and linked on registration, a new user can use the Client Portal immediately (their quotes, invoices, projects) without extra setup.

- **Scalable and flexible**  
  - You can later add multiple Users per Client (e.g. team members) by changing the link (e.g. Client → many Users) without redefining “who owns the quote.”  
  - You can keep contact details (name, email) on Quote/Invoice for display and still have a clear ownership model via `Client`.

- **Security**  
  Backend always filters by Client (derived from `request.user`). The frontend never has to “choose” which client’s data to show; it just shows what the API returns.

---

## 5. Quick reference for developers

### Backend (Django)

- **Get current user’s Client:** `request.user.client_profile`
- **Filter portal data:**  
  - Quotes: `Quote.objects.filter(client=request.user.client_profile)` (plus legacy fallback if needed).  
  - Invoices: `Invoice.objects.filter(client=request.user.client_profile)` (plus legacy fallback).  
  - Projects: `Project.objects.filter(client=request.user.client_profile)` (and optionally public projects).
- **Models:**  
  - `Quote.client` → `Client` (FK)  
  - `Invoice.client` → `Client` (FK)  
  - `Project.client` → `Client` (FK)  
  - `Client.user` → User (OneToOne)

### Frontend (React)

- **After login/register:** API can return `client_profile: { id, name }`; use it for display or routing if needed.
- **Portal APIs:** Call `/api/quotes/`, `/api/invoices/`, `/api/clients/projects/my_projects/` with the user’s JWT; results are already scoped to that user’s Client.
- **No client id in URLs:** Portal pages don’t need to pass “client id” in the URL; the backend infers it from the authenticated user.

### Related docs

- **Architecture & access (Profile as hub, no Dashboard, data visibility):** `docs/ARCHITECTURE_AND_ACCESS.md`
- **Responsibility boundaries (short):** `docs/RESPONSIBILITIES.md`
- **Client Portal workflow (business steps):** `CLIENT_PROJECTS_WORKFLOW.md` (project root)
- **Auth (JWT, login):** `docs/AUTHENTICATION.md`

---

**Last updated:** 2026  
**Purpose:** Step 9 – Clear documentation for developers on User vs Client, linking, Client Portal data flow, and architecture rationale.
