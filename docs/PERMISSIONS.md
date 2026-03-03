# Permissions and Access Control

This document describes how access is enforced so that **clients never access other clients' data** and **admin has full control**.

## Principles

1. **Client isolation** — A client (authenticated user with or without a `Client` profile) can only see and act on their own quotes, invoices, and projects. This is enforced by filtering querysets by `client` FK or `client_email` matching the request user's email.
2. **Admin full control** — Superuser can list, retrieve, create, update, and delete across all quotes and invoices, and use all admin-only actions (e.g. send_response, mark_paid, create_from_quote).
3. **No cross-client data** — The profile API (`GET /api/profile/`) returns only data belonging to the requesting user; it never returns another client's quotes or invoices.

---

## Quotes (`/api/quotes/`)

| Action        | Who can access | How it's enforced |
|---------------|----------------|-------------------|
| **Create**    | Anyone (public) | `AllowAny` for `create`. |
| **List**      | Authenticated  | `get_queryset()`: non-superuser only sees quotes where `client=request.user.client_profile` OR `(client is null AND client_email = request.user.email)`. Superuser sees all. |
| **Retrieve**  | Authenticated  | Same `get_queryset()` — 404 if quote is not in the filtered set (e.g. another client's quote). |
| **Decision** (approve/decline) | Authenticated | Same `get_queryset()`; only the quote owner can call this. Returns 404 for others. |
| **Update**, **Delete**, **send_response**, **approve**, **reject** | Superuser only | `IsSuperuser` for all other actions. |

- **Code:** `quotes/views.py` — `QuoteViewSet.get_queryset()`, `QuoteViewSet.get_permissions()`.

---

## Invoices (`/api/invoices/`)

| Action        | Who can access | How it's enforced |
|---------------|----------------|-------------------|
| **List**, **Retrieve**, **pdf** | Authenticated | `get_queryset()`: non-superuser only sees invoices where `client=request.user.client_profile` OR `(client is null AND client_email = request.user.email)`. Superuser sees all. |
| **Create**, **Update**, **Delete**, **mark_paid**, **create_from_quote** | Superuser only | `IsSuperuser` for these actions. |

- **Code:** `invoices/views.py` — `InvoiceViewSet.get_queryset()`, `InvoiceViewSet.get_permissions()`.

---

## Profile (`GET /api/profile/`)

- **Permission:** `IsAuthenticated`.
- **Data returned:** user, client, quotes, invoices, projects, messages, testimonials.
- **Scoping:** Each resource is filtered by the requesting user:
  - **Quotes:** `client=user.client_profile` OR `(client is null AND client_email=user.email)`.
  - **Invoices:** Same rule.
  - **Projects:** `client=user.client_profile` only.
  - **Messages:** `client=user.client_profile` or `email=user.email`.
  - **Testimonials:** `client=user.client_profile` only.

Clients never receive another client's quotes or invoices. Admin users without a client profile only get data keyed by their user email (typically empty).

- **Code:** `users/views.py` — `ProfileAggregateView.get()`.

---

## Summary

- **Clients must never access other clients' quotes or invoices:** Enforced by `get_queryset()` in `QuoteViewSet` and `InvoiceViewSet`, and by explicit filters in `ProfileAggregateView`.
- **Admin has full control:** Superuser bypasses queryset filtering (returns full queryset) and has permission for all create/update/delete and admin-only actions.
- **Code is documented:** ViewSet and profile docstrings describe access rules; this file provides a single reference for the permission model.
