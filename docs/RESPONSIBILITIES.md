# User vs Client: Responsibility Boundaries

This document defines how **User** and **Client** are used in the system. The separation keeps authentication and authorization distinct from the business/customer entity.

---

## User = Authentication Only

**Responsibility:** Login, identity, and permissions.

- **User** (e.g. `CustomUser` / `AUTH_USER_MODEL`) is used **only** for:
  - **Authentication:** who is logged in (login, session, JWT).
  - **Authorization:** permissions (e.g. `is_staff`, `is_superuser`) and role-based access.
  - **Profile:** optional profile data (name, email, bio) for the person using the system.

**User is not** the business “client” or “customer.” It does not represent the company or person who receives quotes, invoices, or projects in a business sense. A user may *act on behalf of* a client (e.g. log in and see that client’s data) but the user account itself is for access control only.

---

## Client = Business / Customer Entity

**Responsibility:** The customer or business that owns projects, quotes, and invoices.

- **Client** is the entity that:
  - Is the **owner** of projects, quotes, and invoices in business terms.
  - May be represented by:
    - The **Client** model (company/organization: name, logo, industry, etc.) when using the clients app for portfolio/case studies.
    - **Contact info on Quote/Invoice** (client name, email, company) when the workflow is quote → invoice → project without a formal Client record.
  - Can be linked to a **User** for portal access (e.g. “this user can see this client’s quotes/invoices/projects”).

So in the domain:

- **Quotes** and **invoices** belong to the **client** (the customer); contact details may be stored on the quote/invoice or derived from a Client record.
- **Projects** belong to the **client** (the customer), not “to the user” as a business concept; the user is the one who logs in and may be associated with that client.

---

## Summary Table

| Concept        | Responsibility                          | Examples                                      |
|----------------|------------------------------------------|-----------------------------------------------|
| **User**       | Authentication and permissions only     | Login, JWT, `is_superuser`, profile (name, email) |
| **Client**     | Business/customer entity                 | Owner of quotes, invoices, projects; company or contact |

---

## Implementation Notes

- **Quotes / Invoices:** Store client contact info (name, email, company) on the record; they may later be linked to a formal **Client** (FK) if the schema is extended.
- **Projects:** Currently linked to a **User** via `Project.client` (FK to User) to indicate “which logged-in user this project is for.” Conceptually the project belongs to the **client** (the customer); the User is the **contact** or **portal user** for that client. A future step may introduce an explicit **Client** FK and keep User as “contact” only.
- **Client model (clients app):** The business/customer entity. Linked to User via **OneToOneField** (`Client.user`; reverse: `user.client_profile`). Each authenticated user has exactly one client profile (created automatically on user creation; see `clients.signals`). **Step 4:** On user registration, a Client is auto-created so the client portal works immediately after login; register and login responses include `client_profile: { id, name }`.
- **Full developer guide:** See **`docs/USER_AND_CLIENT_GUIDE.md`** for User vs Client, how they are linked, Client Portal data flow, and why this architecture is used.

---

**Last updated:** 2026  
**Purpose:** Step 1 – Define clear responsibility boundaries. For full Client Portal and data-flow details, see **`docs/USER_AND_CLIENT_GUIDE.md`**.
