# Quote → Payment → Project Workflow

## Overall goal

The program implements this **exact loop** with strict permission checks:

1. **Client submits quote**
2. **Admin replies**
3. **Client approves**
4. **Redirect to payment**
5. **Payment confirmed**
6. **Invoice created** (created automatically when client approves, so there is an invoice to pay)
7. **Invoice marked paid**
8. **Project created and linked to client**

Clients never access other clients’ data; admin has full control. See [PERMISSIONS.md](PERMISSIONS.md).

---

## Flow (implementation)

```
Client submits quote
        ⬇
    Admin replies (status → replied, payment_url set)
        ⬇
Client sees reply in Profile / Portal → clicks Approve
        ⬇
   Invoice created (Draft, auto) — backend on approve
        ⬇
  Redirect to payment (payment_url; fallback set on approve if missing)
        ⬇
   Payment confirmed (external gateway or manual)
        ⬇
   Invoice marked paid (POST /api/invoices/<id>/mark_paid/)
        ⬇
  Project created and linked to client (signal on invoice Paid)
```

---

## Implementation Map

| Step | Where it happens |
|------|------------------|
| **1. Client submits quote** | Public or profile: **POST /api/quotes/** (`quotes/views.py` – `QuoteViewSet.create`). Status set to `pending`. |
| **2. Admin replies** | Admin: set `admin_response`, set status to `replied`, set `responded_at` and `payment_url` (`quotes/views.py` – update / `send_response`; `quotes/admin.py`). |
| **3. Quote status = replied** | Stored on `Quote.status`; `payment_url` set when admin marks as replied (`get_quote_payment_url` in `quotes/views.py`). |
| **4. Client sees reply in profile** | **GET /api/profile/** returns client’s quotes with `admin_response`, `status`, `payment_url` (`users/views.py` – `ProfileAggregateView`; `ProfileQuoteSerializer`). Profile page shows reply and Approve/Decline for `replied` quotes. |
| **5. Client clicks Approve** | Profile: **POST /api/quotes/<id>/decision/** with `{ "decision": "approve" }` (`quotes/views.py` – `decision`). Owner-only via `get_queryset`. |
| **6. Redirect to payment** | Frontend uses `payment_url` from decision response; `window.location.href = payment_url` (`frontend/src/pages/Profile.js` – `handleQuoteApprove`). If no `payment_url`, shows “No payment link available”. |
| **7. Invoice created** | On approve, backend calls `_auto_create_invoice_for_quote(quote)` in `quotes/views.py` (inside `decision`). Invoice is created with status `Draft`; details copied from quote (`invoices/models.py` – `_populate_from_quote`). |
| **8. Invoice paid** | After successful payment: admin calls **POST /api/invoices/<id>/mark_paid/** (superuser only). A payment gateway webhook can call the same logic to mark paid without manual admin action. |
| **9. Project starts** | When an invoice’s status changes to `Paid`, signal `create_project_on_invoice_paid` in `clients/signals.py` automatically creates a **Project** linked to the invoice’s quote and client. Client sees it under Profile/Portal “My Projects”. |

---

## Key endpoints (client-facing)

- **GET /api/profile/** – Quotes, invoices, projects for logged-in client.
- **POST /api/quotes/** – Submit quote (public or authenticated).
- **POST /api/quotes/<id>/decision/** – Approve or decline (owner only); returns `payment_url` on approve.
- **GET /api/invoices/<id>/pdf/** – Download invoice PDF (own invoices only).

## Key endpoints (admin)

- **PATCH /api/quotes/<id>/** – Update quote, set `admin_response`, set status to `replied` (and thus `payment_url`). Superuser only.
- **POST /api/quotes/<id>/send_response/** – Send reply email and set replied + `payment_url`. Superuser only.
- **POST /api/invoices/<id>/mark_paid/** – Mark invoice paid (triggers project creation). Superuser only. Can be called from a payment gateway webhook with a service account.

## Architecture notes

- **Permission checks:** Queries are scoped by `get_queryset()` so clients only see their own quotes/invoices; admin has full access. See [PERMISSIONS.md](PERMISSIONS.md).
- **Invoice on approve:** The invoice is created when the client approves (status Draft) so there is a concrete invoice to pay; when that invoice is marked paid, the project is created automatically.
- **Clean separation:** Quotes (quotes app), Invoices (invoices app), Projects (clients app); signal in `clients/signals.py` couples invoice paid → project creation without circular imports.
