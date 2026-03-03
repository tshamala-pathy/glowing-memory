System Architecture
===================

This document explains how the PathyCode Internal Business System is structured
at a high level, and how core concepts (User vs Client, dashboards, and
business workflows) map onto the codebase.


User vs Client
--------------

The system clearly separates **authentication** from the **business entity**:

* **User** (Django ``AUTH_USER_MODEL`` in the ``users`` app)

  - Represents the authenticated account (login credentials, email, password).
  - Used for permissions and roles (superuser, staff vs normal user).
  - Each user **may** have exactly one related Client profile.

* **Client** (``clients.Client`` model)

  - Represents the *business/customer entity* that owns quotes, invoices and
    projects.
  - Linked to a user via ``Client.user`` (``OneToOneField`` with
    ``related_name='client_profile'``).
  - Is the owner of:

    - ``Client.projects`` (client projects / portfolio)
    - ``Client.quotes`` (quote requests)
    - ``Client.invoices`` (billing documents)

This separation keeps authentication concerns (users, passwords, roles) cleanly
isolated from domain concepts (clients, projects, revenue).


Dashboard vs Profile
--------------------

There are two main entry points for authenticated users, depending on their
role:

* **Admin Dashboard** (``/admin`` in the React frontend, Django admin, and
  dedicated API endpoints)

  - Accessible only to **superusers** (and some staff-only views such as the
    financial dashboard).
  - Used to manage:

    - Service catalog, blog posts, marketing content.
    - Incoming quotes and estimates.
    - Invoices, payments, financial dashboards.
    - Client projects, case studies, and internal tasks.
  - Implemented in the frontend under ``frontend/src/pages/admin/*`` and
    powered by REST endpoints like:

    - ``/api/quotes/``
    - ``/api/invoices/``
    - ``/api/clients/projects/``
    - ``/api/clients/clients/``

* **Client Profile & Portal** (``/profile``, ``/portal``, ``/my-projects``)

  - Accessible to authenticated **non-admin** users (clients).
  - ``/profile`` is the main hub for a logged-in client.
  - ``/portal`` (Client Portal) surfaces:

    - The client’s own quotes (via ``/api/profile/``).
    - The client’s own invoices (with PDF download).
    - The client’s own projects.
  - ``/my-projects`` is a client-friendly listing of projects associated with
    that client profile.

In short:

* **Admins / staff** work primarily in the **Admin Dashboard** and Django
  admin.
* **Clients** work in the **Profile** and **Client Portal**, which expose only
  their own business data and hide internal notes and admin-only fields.


Quote → Payment → Invoice → Project Workflow
-------------------------------------------

The core business workflow is implemented across the ``quotes``, ``invoices``
and ``clients`` apps:

1. **Quote Request**

   - A client (authenticated or public) submits a quote via the public API
     (``POST /api/quotes/``).
   - The ``quotes.Quote`` model records project details, contact information,
     and acceptance of requirements.
   - Status flow starts at ``pending``.

2. **Admin Review & Response**

   - Admins view and update quotes via:

     - Django admin (``quotes.admin.QuoteAdmin``)
     - React admin UI (``AdminQuotes`` page, ``/admin/quotes``)

   - Admins set:

     - ``estimated_amount``
     - ``admin_response`` (text that is emailed to the client)
     - Status transitions from ``pending`` → ``replied`` → ``approved`` or
       ``declined`` are enforced by ``Quote.validate_status_transition``.

3. **Client Decision and Payment**

   - The client decides via the ``decision`` action on ``QuoteViewSet``:

     - ``POST /api/quotes/{id}/decision/`` with ``{"decision": "approve"}`` or
       ``{"decision": "decline"}``.

   - Approval moves the quote to ``approved``, records timestamps, and assigns
     it to a user (admin).
   - A **payment URL** (``payment_url``) is stored on the quote so the
     frontend can redirect the client to payment/portal flows.

4. **Automatic Invoice Creation**

   - When a quote becomes ``approved`` (either by client decision or admin
     using the ``approve`` action), the helper
     ``_auto_create_invoice_for_quote`` in ``quotes.views`` runs.
   - It:

     - Ensures the quote is approved.
     - Creates a draft ``invoices.Invoice`` if none exists yet for the quote.
     - Relies on ``Invoice._populate_from_quote`` to copy client and project
       details and to build a default line item.
     - Attempts to move the quote status to ``invoiced`` after successful
       invoice creation.

5. **Invoice Payment**

   - Admins manage invoices via:

     - ``InvoiceViewSet`` (``/api/invoices/``)
     - React AdminInvoices page and Django admin.

   - When an invoice is marked as paid (``mark_paid`` action):

     - The invoice status is set to ``paid``, ``amount_paid`` equals
       ``total_amount``, and timestamps (``paid_date``, ``paid_at``) are
       recorded.
     - The linked quote status is moved from ``invoiced`` (or ``approved``) to
       ``paid`` using the quote state machine.

6. **Automatic Project Creation**

   - A signal in ``clients.signals`` watches for Invoice status changes.
   - When an invoice transitions to ``paid``:

     - A new ``clients.Project`` is created (if one does not already exist for
       that invoice).
     - The project is linked to the same Client and Quote, with status
       ``in_progress`` (active project).

7. **Project Completion & Testimonials**

   - When a project status changes to ``completed`` (via admin tools):

     - A signal sets ``completed_at`` (timestamp).
     - A courtesy email to the client invites them to leave a testimonial or
       case-study content.

This workflow ensures a clean, auditable chain:

**Quote → Invoice → Payment → Project**, with automatic transitions implemented
in views, serializers, and signals.


Service-layer Design Pattern
----------------------------

The codebase follows a *service-layer-oriented* structure while leveraging
Django REST Framework and Django’s ORM:

* **Models** (Domain Layer)

  - ``quotes.models.Quote`` encodes the status state machine and domain rules
    (e.g., valid transitions).
  - ``invoices.models.Invoice`` encapsulates:

    - Calculation logic (``calculate_totals``).
    - Auto-generation of invoice numbers.
    - Deriving line items and notes from quotes.

  - ``clients.models.Project`` and related classes (``Task``, ``CaseStudy``)
    encode ownership and validation rules (e.g. a project’s invoice must be
    paid).

* **Views / ViewSets** (Service Layer)

  - REST viewsets (``QuoteViewSet``, ``InvoiceViewSet``, ``ProjectViewSet``,
    etc.) act as the *service layer*:

    - They orchestrate calls to model methods, signals, and utilities.
    - They enforce permissions, validate inputs, and coordinate multi-step
      operations (e.g., creating invoices from quotes, marking invoices paid).

  - Helper functions in views (e.g. ``_auto_create_invoice_for_quote``,
    ``send_invoice_email``, ``get_quote_payment_url``) group reusable
    operations into small service-like functions.

* **Serializers** (Boundary Layer)

  - Serializers (e.g. ``QuoteSerializer``, ``InvoiceSerializer``,
    ``ProjectSerializer``):

    - Define which fields are exposed to which actors (e.g. hide internal
      notes from non-admins).
    - Provide additional read-only projections (e.g. ``quote_project_title``,
      ``invoice_number``).

* **Utilities & Docs**

  - Utility modules (e.g. ``invoices.utils.generate_invoice_pdf``,
    ``quotes.utils.generate_quote_pdf``) implement cross-cutting concerns like
    PDF generation, keeping views and models focused on domain logic.
  - Sphinx documentation (this file and related pages) documents the
    architecture and workflows, helping maintain alignment between
    implementation and design.

This combination keeps responsibilities well separated:

* **Models** encapsulate core domain rules.
* **ViewSets and helpers** act as a focused service layer.
* **Serializers** define the public API surface.
* **Signals and utilities** handle side effects and automation (auto-creating
  invoices and projects, sending emails, generating documents).

