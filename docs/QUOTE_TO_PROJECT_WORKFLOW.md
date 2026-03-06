# Quote → Payment → Invoice → Project Workflow

SaaS-style business flow: client requests a quote, admin reviews and replies, client approves or declines, then pays; invoice and project are created automatically.

---

## Flow overview

```
1. Client submits quote request          → status = pending
2. Admin reviews and replies              → proposed_price, admin_notes, estimated_delivery_time; status = reviewed
3. Client sees reply in Client Portal     → My Quotes (admin response, price, notes)
4. Client approves or declines            → Approve → status = approved, redirect to Payment page
                                          → Decline → status = declined, workflow ends
5. Client completes payment               → /payment/{quote_id}; only if quote.status == approved
6. Payment recorded                       → Payment (paid), then Invoice created automatically (status = paid)
7. Invoice paid                           → clients.signals creates Project (status = planning, start_date set)
8. Client sees                            → My Invoices, My Projects (Client Portal + Admin Dashboard)
```

**Relationship chain:** `Client → Quotes → Payment → Invoice → Project`

---

## Quote statuses

| Status    | Who sets it | Next allowed |
|-----------|-------------|--------------|
| `pending` | System (on submit) | `reviewed` |
| `reviewed`| Admin (after reply) | `approved`, `declined` |
| `approved`| Client (approve) | — (client goes to payment) |
| `declined`| Client (decline) | — |

Legacy: `replied` (same as reviewed for client decision), `invoiced`, `paid` kept for existing data.

---

## Implementation map

| Step | Where |
|------|--------|
| **1. Client submits quote** | `POST /api/quotes/` (public or authenticated). Status = `pending`. |
| **2. Admin replies** | Admin: set `estimated_amount`, `admin_response`, `estimated_delivery_time`, then `POST /api/quotes/<id>/send_response/` or set status to `reviewed` in admin. `payment_url` set to `/payment/{id}`. |
| **3. Client sees reply** | `GET /api/profile/` returns quotes with `admin_response`, `total_price`, `estimated_delivery_time`, `status`. Client Portal shows Approve/Decline for `reviewed` or `replied`. |
| **4. Client approves/declines** | `POST /api/quotes/<id>/decision/` with `{ "decision": "approve" }` or `"decline"`. Owner-only. On approve, frontend redirects to `/payment/{quote_id}`. |
| **5. Payment page** | Frontend `/payment/:quoteId`. `GET /api/payment/quote/<id>/` returns amount and eligibility (quote must be `approved`, user must be quote owner). |
| **6. Record payment** | `POST /api/payment/quote/<id>/` creates `Payment` (paid), then `Invoice` (status=paid). Idempotent if invoice already exists. |
| **7. Project created** | `clients.signals.create_project_on_invoice_paid`: on invoice save with status `paid`, creates `Project` (client, quote, invoice, status=`planning`, start_date=today). |

---

## Key endpoints

### Client-facing

- `GET /api/profile/` — Quotes, invoices, projects for logged-in client.
- `POST /api/quotes/` — Submit quote.
- `POST /api/quotes/<id>/decision/` — Approve or decline (owner only). Returns quote with `payment_url` on approve.
- `GET /api/payment/quote/<id>/` — Payment page data (amount, project title). Only if quote is approved and user is owner.
- `POST /api/payment/quote/<id>/` — Record payment success; creates Payment + Invoice (paid); Project created via signal.
- `GET /api/invoices/<id>/pdf/` — Download invoice PDF (own only).

### Admin

- `PATCH /api/quotes/<id>/` — Update quote (e.g. set status to `reviewed`, add response fields). Superuser.
- `POST /api/quotes/<id>/send_response/` — Send reply email and set status to `reviewed`. Superuser.
- `POST /api/invoices/<id>/mark_paid/` — Mark invoice paid (e.g. manual or webhook). Triggers project creation. Superuser.

---

## Models

- **Quote:** `client`, `service_type`, `project_title`, `project_description`, `estimated_budget`/`budget_range`, `timeline`, `status`; admin: `estimated_amount` (proposed price), `admin_response`, `estimated_delivery_time`.
- **Payment:** `client`, `quote` (OneToOne), `amount`, `payment_status`, `payment_date`. One per quote.
- **Invoice:** `invoice_number`, `client`, `quote`, `service` (from quote), `amount`, `status` (unpaid/paid), `issue_date`. Created when payment is completed.
- **Project:** `client`, `quote`, `invoice`, `name`, `description`, `status` (default `planning`), `start_date`. Created when invoice becomes paid.

---

## Permissions

- **Clients:** See only their own quotes, invoices, projects (by `client` or `client_email`).
- **Admins:** Full access to all quotes, invoices, projects, payments.

See [PERMISSIONS.md](PERMISSIONS.md) for details.
