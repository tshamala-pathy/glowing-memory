Business Workflows
==================

This page documents the main business workflow in the PathyCode Internal
Business System, from the initial quote request through payment, invoicing and
project delivery.


High-level Flow (Text Diagram)
------------------------------

The core flow can be visualised as a simple text-based diagram:

.. code-block:: text

   Client submits quote
        |
        v
   Admin reviews & replies
        |
        v
   Client approves quote
        |
        v
   Client is redirected to payment
        |
        v
   Payment is confirmed via webhook/callback
        |
        v
   Invoice is created/updated
        |
        v
   Project is created and started

The sections below describe each step in more detail and reference the
relevant models, views and signals.


1. Client Submits Quote
-----------------------

**Goal:** Capture a structured project request from a prospective or existing
client.

- **Entry points**

  - Public quote form in the marketing site.
  - Authenticated client starting a new quote from their profile/portal.

- **Backend**

  - Endpoint: ``POST /api/quotes/`` (``QuoteViewSet.create``).
  - Model: ``quotes.models.Quote``.
  - Typical fields:

    - Client contact details (name, email).
    - Project summary and requirements.
    - Budget/estimate expectations.
    - Flags for terms of service and privacy agreement.

- **Result**

  - A new ``Quote`` instance is created with status ``pending``.
  - Notifications can be sent to admins (e.g. email or dashboard alert).


2. Admin Replies to Quote
-------------------------

**Goal:** Admin reviews the request, estimates the work, and sends a formal
response back to the client.

- **Admin tooling**

  - Django admin (``quotes.admin.QuoteAdmin``) for quick internal updates.
  - React admin page (e.g. ``AdminQuotes``) listing incoming and active quotes.

- **Actions**

  - Admin fills in:

    - ``estimated_amount`` (proposed price).
    - ``admin_response`` (detailed message/conditions).
  - Status usually moves from:

    - ``pending`` → ``replied`` or directly to ``approved`` for simple cases.
  - Status transitions are validated by
    ``Quote.validate_status_transition``.

- **Result**

  - The client receives an email (or portal notification) with the admin
    response and a link back into the portal to approve or decline.


3. Client Approves Quote
------------------------

**Goal:** Client explicitly accepts or declines the proposal.

- **Frontend**

  - Client logs into the portal and reviews the quote, or follows a secure
    link from the email.
  - UI presents two clear actions: *Approve* or *Decline*.

- **Backend**

  - Endpoint: ``POST /api/quotes/{id}/decision/`` (``QuoteViewSet.decision``).
  - Payload example:

    .. code-block:: json

       {"decision": "approve"}

  - Logic:

    - On approval:

      - Status moves from ``replied`` → ``approved``.
      - Timestamps and audit fields are updated.
      - Client is redirected to payment; invoice and project are created when payment completes.

    - On decline:

      - Status becomes ``declined``, and the workflow ends for this quote.

- **Result**

  - The system now has an *approved* quote that can be invoiced and paid.


4. Redirect to Payment
----------------------

**Goal:** Take the client from an approved quote to a payment experience.

- **Payment URL**

  - The quote stores a ``payment_url`` or similar field that points to:

    - An internal payment page (e.g. ``/pay/{quote_or_invoice_id}``).
    - Or an external payment provider checkout URL.

- **Frontend behaviour**

  - After the client approves, the UI redirects them to the payment screen.
  - If the user returns later, the portal can still offer a *Pay now* button
    using the same stored URL.

- **Result**

  - The user is now in the hands of the payment provider / payment page.


5. Payment Webhook / Callback
-----------------------------

**Goal:** Receive authoritative confirmation that a payment succeeded or
failed.

- **External payment provider**

  - The provider (Stripe, PayPal, or a manual bank transfer process) sends a
    webhook/callback when payment status changes.
  - In simpler setups, an admin may manually mark an invoice as paid in the
    admin interface instead of using a full webhook.

- **Backend handling**

  - Webhook or admin action ultimately calls into logic equivalent to:

    - ``InvoiceViewSet.mark_paid``, or
    - A dedicated service that sets the invoice status to ``paid``.

  - Effects:

    - ``status`` becomes ``paid``.
    - ``amount_paid`` and ``paid_at``/``paid_date`` are set.
    - Related ``Quote`` moves from ``invoiced``/``approved`` → ``paid``.

- **Result**

  - The system now recognises the invoice as paid and can advance to project
    work.


6. Invoice Creation
-------------------

**Goal:** Create an invoice that formalises the financial agreement and is
linked to the quote and client.

- **Automatic creation on payment**

  - Invoice and Project are created when payment is confirmed (PayFast ITN,
    simulate_itn, or ``PaymentQuoteView.post`` for direct payment recording).
  - The ``clients.signals.create_project_on_invoice_paid`` signal creates the
    Project when an invoice transitions to ``paid``.

- **Manual editing**

  - Admins can refine invoice details, add line items or adjust totals in:

    - Django admin (``InvoiceAdmin``).
    - React AdminInvoices page.

- **Result**

  - A consistent Invoice object exists with a clear link back to the original
    quote and the owning client.


7. Project Creation
-------------------

**Goal:** Automatically create an actionable project once the financial
agreement is settled and payment is confirmed.

- **Signals**

  - A signal in ``clients.signals`` watches for invoices transitioning to
    ``paid``.
  - When triggered:

    - If no project yet exists for that invoice, it creates a new
      ``clients.Project`` linked to:

      - The same Client.
      - The related Quote (if present).
      - The paid Invoice.

    - Sets initial project status to ``in_progress`` and copies descriptive
      details from the quote/invoice.

- **Admin tooling**

  - Admins manage the resulting project via:

    - Django admin (``ProjectAdmin`` with inline ``Task`` objects).
    - React admin pages listing active and completed projects.

- **Completion**

  - When the project reaches completion:

    - Status is set to ``completed``.
    - Another signal sets ``completed_at`` and optionally sends an email asking
      for a testimonial or case study.

- **Result**

  - The system now holds a full chain:

    ``Client`` → ``Quote`` → ``Invoice`` → ``Project``, with automation at
    each stage to minimise manual work and keep data consistent.

