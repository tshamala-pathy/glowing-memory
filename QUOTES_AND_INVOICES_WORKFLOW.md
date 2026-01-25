# Quotes and Invoices Workflow Documentation

## Overview

This document explains the complete business workflow for Quotes and Invoices in the PathyCode system. The system enforces a professional workflow where **Invoices can only be generated from approved Quotes**, ensuring data integrity and audit trails.

---

## 📘 Quotes vs Invoices

### What is a Quote?

A **Quote** (also called an "Estimate" or "Proposal") is:
- A preliminary estimate of costs for a project
- Submitted by clients through the public quote request form
- Reviewed and approved/rejected by administrators
- **Not a bill** - it's an offer to do work at a specified price
- Can be modified, negotiated, or rejected

**Quote Statuses:**
- `Pending` - Just submitted, awaiting review
- `Reviewed` - Admin has reviewed but not yet responded
- `Replied` - Admin has sent a response to the client
- `Approved` - Admin has approved the quote (ready for invoice generation)
- `Rejected` - Quote was rejected
- `In Progress` - Work has started
- `Completed` - Project is complete

### What is an Invoice?

An **Invoice** is:
- A formal bill requesting payment for work done or to be done
- **Only created from approved quotes**
- A legally binding document
- Sent to clients for payment
- Tracks payment status (Draft, Sent, Paid, Overdue, Cancelled)

**Invoice Statuses:**
- `Draft` - Created but not yet sent to client
- `Sent` - Invoice has been sent to client
- `Paid` - Payment has been received
- `Overdue` - Payment is past due date
- `Cancelled` - Invoice was cancelled

### When Each is Used

| Stage | Document | Purpose |
|-------|----------|---------|
| Client inquiry | Quote Request | Client submits project requirements |
| Admin review | Quote | Admin reviews and approves/rejects |
| Client acceptance | Quote (Approved) | Client accepts the quote |
| Billing | Invoice | Admin generates invoice from approved quote |
| Payment | Invoice | Client pays based on invoice |
| Record keeping | Both | Both documents are kept for audit trail |

---

## 📘 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SUBMITS QUOTE                      │
│              (Public form at /request-quote)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              QUOTE STATUS: Pending                           │
│  • Confirmation email sent to client                        │
│  • Notification email sent to admin                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN REVIEWS QUOTE                             │
│  • Admin views quote in admin panel                         │
│  • Admin adds estimated amount                              │
│  • Admin adds admin response                                │
│  • Admin sets status to "Reviewed" or "Replied"             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN APPROVES QUOTE                            │
│  • Admin sets status to "Approved"                          │
│  • Quote is now ready for invoice generation                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN GENERATES INVOICE                         │
│  • Admin selects approved quote                             │
│  • System validates quote is approved                       │
│  • Invoice is auto-populated from quote                     │
│  • Invoice number is auto-generated                         │
│  • Invoice status: Draft                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ADMIN SENDS INVOICE                             │
│  • Admin sets invoice status to "Sent"                      │
│  • Email automatically sent to client                       │
│  • Invoice includes payment details                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT PAYS INVOICE                             │
│  • Client makes payment                                     │
│  • Admin marks invoice as "Paid"                            │
│  • Payment date is recorded                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📘 Data Relationships

### One Quote → One Invoice

**Design Decision: OneToOneField**

The system uses a **OneToOneField** relationship between Quote and Invoice:

```python
# In Invoice model
quote = models.OneToOneField(
    'quotes.Quote',
    on_delete=models.PROTECT,
    related_name='invoice'
)
```

**Why This Design?**

1. **Business Logic**: Each approved quote should generate exactly one invoice
2. **Data Integrity**: Prevents duplicate invoices for the same quote
3. **Audit Trail**: Clear link between quote and invoice for accounting
4. **Simplicity**: One quote = one invoice makes the workflow clear

**Key Constraints:**
- ✅ One quote can have **at most one** invoice
- ✅ One invoice **must** be linked to exactly one quote
- ✅ Invoice cannot exist without a quote
- ✅ Quote must be **approved** before invoice creation
- ✅ Quote cannot be deleted if it has an invoice (PROTECT)

### Data Flow

When an invoice is created from a quote:

1. **Client Information** is copied from quote:
   - `client_name` ← `quote.client_name`
   - `client_email` ← `quote.client_email`
   - `client_phone` ← `quote.client_phone`
   - `client_company` ← `quote.company_name`

2. **Financial Information** is populated:
   - `subtotal` ← `quote.estimated_amount` (if available)
   - `total_amount` ← `quote.estimated_amount` (if available)
   - Invoice item created from `quote.project_title`

3. **Quote Data Remains Immutable**:
   - Quote data is **not modified** after invoice creation
   - This ensures audit trail integrity
   - Historical quote data is preserved

---

## 📘 Admin Workflow

### How to Approve a Quote

1. **Navigate to Django Admin** → Quotes
2. **Select the quote** you want to approve
3. **Update the quote**:
   - Set `estimated_amount` (if not already set)
   - Set `status` to "Approved"
   - Optionally add `admin_response`
   - Optionally assign to a team member
4. **Save** the quote

**Alternative: Use React Admin Panel**
- Navigate to `/admin/quotes`
- Click on a quote to view details
- Click "Edit Quote"
- Update status to "Approved"
- Save

### How to Generate an Invoice

#### Method 1: Django Admin Action (Bulk)

1. **Navigate to Django Admin** → Quotes
2. **Select one or more approved quotes** (checkbox)
3. **Select action**: "Generate Invoice from Selected Approved Quotes"
4. **Click "Go"**
5. System will:
   - Validate quotes are approved
   - Check invoices don't already exist
   - Create invoices with auto-generated numbers
   - Auto-populate data from quotes
   - Set status to "Draft"

#### Method 2: Django Admin (Individual)

1. **Navigate to Django Admin** → Invoices
2. **Click "Add Invoice"**
3. **Select an approved quote** from the dropdown
4. **Fill in optional fields**:
   - `issue_date` (defaults to today)
   - `due_date` (defaults to 30 days from issue date)
   - `status` (defaults to "Draft")
5. **Save** - System will:
   - Validate quote is approved
   - Auto-populate client data
   - Auto-generate invoice number
   - Calculate totals

#### Method 3: API Endpoint

```http
POST /api/invoices/create_from_quote/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
    "quote_id": 123,
    "issue_date": "2026-01-20",  // optional
    "due_date": "2026-02-20",    // optional
    "status": "Draft"            // optional
}
```

#### Method 4: React Admin Panel

1. Navigate to `/admin/quotes`
2. View an approved quote
3. Click "Generate Invoice" button (if implemented)
4. Invoice is created and you're redirected to invoice details

### How to Track Payment Status

1. **Navigate to Django Admin** → Invoices
2. **Filter by status**:
   - `Draft` - Not yet sent
   - `Sent` - Sent to client, awaiting payment
   - `Paid` - Payment received
   - `Overdue` - Past due date
   - `Cancelled` - Invoice cancelled

3. **Update payment status**:
   - When client pays, set `status` to "Paid"
   - Set `amount_paid` to total amount
   - Set `paid_date` to payment date
   - Add `payment_method` and `payment_reference`

4. **Automatic Status Updates**:
   - System automatically sets status to "Overdue" if due date passes
   - System automatically sets status to "Paid" if `amount_due` reaches zero

---

## 📘 API Endpoints

### Quote Endpoints

#### `POST /api/quotes/` (Public)
Create a new quote request.

#### `GET /api/quotes/` (Authenticated)
List all quotes (admin only in practice).

#### `GET /api/quotes/{id}/` (Authenticated)
Get quote details.

#### `PUT /api/quotes/{id}/` (Authenticated)
Update quote (admin only).

#### `POST /api/quotes/{id}/approve/` (Authenticated)
Approve a quote (sets status to "Approved").

### Invoice Endpoints

#### `POST /api/invoices/` (Admin Only)
Create a new invoice from an approved quote.

**Request Body:**
```json
{
    "quote": 123,  // Required: ID of approved quote
    "issue_date": "2026-01-20",  // Optional
    "due_date": "2026-02-20",    // Optional
    "status": "Draft"            // Optional
}
```

**Validation:**
- Quote must exist
- Quote must be approved
- Invoice must not already exist for this quote

#### `POST /api/invoices/create_from_quote/` (Admin Only)
Convenience endpoint to create invoice from quote.

**Request Body:**
```json
{
    "quote_id": 123,
    "issue_date": "2026-01-20",  // Optional
    "due_date": "2026-02-20",    // Optional
    "status": "Draft"            // Optional
}
```

#### `GET /api/invoices/` (Authenticated)
List all invoices.

#### `GET /api/invoices/{id}/` (Authenticated)
Get invoice details.

#### `PUT /api/invoices/{id}/` (Admin Only)
Update invoice.

#### `POST /api/invoices/{id}/mark_paid/` (Admin Only)
Mark invoice as paid.

#### `GET /api/invoices/{id}/pdf/` (Authenticated)
Download invoice as PDF.

---

## 📘 Business Rules & Validation

### Quote Validation

1. ✅ Quote can be created by anyone (public)
2. ✅ Quote must have `requirements_accepted = true`
3. ✅ Required fields: `client_name`, `client_email`, `project_title`, `project_description`, `service_type`

### Invoice Validation

1. ✅ Invoice can only be created by admin users
2. ✅ Invoice **must** be linked to a quote (OneToOneField)
3. ✅ Quote **must** be approved (`status = 'Approved'`)
4. ✅ Only **one invoice** per quote (enforced by OneToOneField)
5. ✅ Invoice data is auto-populated from quote
6. ✅ Quote data remains immutable after invoice creation

### Automatic Behaviors

1. **Invoice Creation**:
   - Invoice number auto-generated: `INV-YYYYMMDD-XXXXXXXX`
   - Client data copied from quote
   - Amount copied from `quote.estimated_amount`
   - Default due date: 30 days from issue date
   - Totals calculated automatically

2. **Status Updates**:
   - Invoice status → "Overdue" if due date passes
   - Invoice status → "Paid" if `amount_due` reaches zero

3. **Email Notifications**:
   - Email sent to client when invoice status changes to "Sent"
   - Email includes invoice number, amount, and due date

---

## 📘 Access Control

### Public Access
- ✅ Submit quote requests (`POST /api/quotes/`)
- ✅ View requirements page
- ✅ View quote request form

### Authenticated Access
- ✅ View quotes (`GET /api/quotes/`)
- ✅ View invoices (`GET /api/invoices/`)
- ✅ Download invoice PDFs

### Admin Only
- ✅ Create invoices
- ✅ Update invoices
- ✅ Approve quotes
- ✅ Update quote status
- ✅ Delete invoices
- ✅ Mark invoices as paid

### Client Restrictions
- ❌ Clients **cannot** edit invoices
- ❌ Clients **cannot** create invoices
- ❌ Clients **cannot** approve quotes
- ✅ Clients can only submit quote requests

---

## 📘 Email Notifications

### Quote Emails

1. **Client Confirmation** (on quote submission)
   - Subject: "Quote Request Received - PathyCode"
   - Sent to: Client email
   - Content: Confirmation of receipt, project details

2. **Admin Notification** (on quote submission)
   - Subject: "New Quote Request: {project_title}"
   - Sent to: All admin users
   - Content: Quote details, client information

3. **Client Response** (when admin replies)
   - Subject: "Response to Your Quote Request: {project_title}"
   - Sent to: Client email
   - Content: Admin's response, estimated amount

### Invoice Emails

1. **Invoice Sent** (when status changes to "Sent")
   - Subject: "Invoice {invoice_number} - PathyCode"
   - Sent to: Client email
   - Content: Invoice number, amount due, due date, payment details

---

## 📘 Error Handling

### Common Errors

1. **"Invoice can only be created from an approved quote"**
   - **Cause**: Trying to create invoice from non-approved quote
   - **Solution**: Approve the quote first

2. **"An invoice already exists for this quote"**
   - **Cause**: Trying to create second invoice for same quote
   - **Solution**: Use the existing invoice or delete it first

3. **"Quote is required to create an invoice"**
   - **Cause**: Missing quote field in request
   - **Solution**: Provide quote ID in request

4. **"Cannot delete quote: invoice exists"**
   - **Cause**: Trying to delete quote that has an invoice
   - **Solution**: Delete invoice first, or keep both for audit trail

---

## 📘 Testing Checklist

### Quote Workflow
- [ ] Client can submit quote request
- [ ] Confirmation email sent to client
- [ ] Admin notification email sent
- [ ] Admin can view quote
- [ ] Admin can approve quote
- [ ] Approved quote shows in admin panel

### Invoice Workflow
- [ ] Admin can generate invoice from approved quote
- [ ] Invoice data auto-populated from quote
- [ ] Invoice number auto-generated
- [ ] Cannot create invoice from non-approved quote
- [ ] Cannot create second invoice for same quote
- [ ] Invoice email sent when status changes to "Sent"
- [ ] Payment tracking works correctly

### Data Integrity
- [ ] Quote data immutable after invoice creation
- [ ] One-to-one relationship enforced
- [ ] Cannot delete quote with invoice
- [ ] Invoice totals calculated correctly

---

## 📘 Future Enhancements

Potential improvements:

1. **Quote Templates**: Pre-filled templates for common projects
2. **Invoice Templates**: Customizable invoice layouts
3. **Payment Gateway**: Integration with payment processors
4. **Recurring Invoices**: For maintenance/support contracts
5. **Quote Expiration**: Auto-expire quotes after 30 days
6. **Invoice Reminders**: Automatic reminders for overdue invoices
7. **Client Portal**: Allow clients to view their quotes and invoices
8. **Reporting**: Financial reports and analytics

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Status**: Production Ready
