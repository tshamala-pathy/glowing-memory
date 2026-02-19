# Quote Request Workflow Documentation

## Overview

The Quotes system provides a complete workflow for managing client quote requests from submission to response. This document explains the entire process, from client submission through admin response and email automation.

---

## Workflow Overview

```
Client Submission → Email Confirmation → Admin Notification → Admin Review → Admin Response → Client Email
```

### Step-by-Step Process

1. **Client Submission** (`POST /api/quotes/`)
   - Client fills out quote request form at `/request-quote`
   - Must accept requirements checkbox
   - Form validates all required fields
   - Quote is saved to database with status "Pending"
   - `requirements_accepted_at` timestamp is set

2. **Email Automation (Automatic)**
   - **Client Confirmation Email**: Sent immediately after submission
     - Confirms receipt of quote request
     - Includes project details
     - Sets expectation (24-48 hour response time)
   - **Admin Notification Email**: Sent to all admin users
     - Notifies admins of new quote request
     - Includes client and project information
     - Provides quote ID for reference

3. **Admin Review** (Django Admin or React Admin Panel)
   - Admin views quote request
   - Can filter by status, service type, date
   - Can assign quote to team member
   - Can add internal notes

4. **Admin Response**
   - Admin adds response in `admin_response` field
   - Can set status to "Reviewed" (internal review complete)
   - Can set status to "Replied" (response sent)
   - Can manually trigger email via "Send Response Email" button

5. **Client Notification (Automatic)**
   - When status changes to "Replied" and `admin_response` exists:
     - Response email is automatically sent to client
     - Includes admin's response text
     - Includes estimated amount (if provided)
     - `replied_at` timestamp is set

---

## Model Fields

### Client Information
- `client_name` (required): Full name of client
- `client_email` (required): Email for communication
- `client_phone` (optional): Phone number
- `company_name` (optional): Company name

### Project Details
- `project_title` (required): Title of the project
- `project_description` (required): Detailed project description
- `service_type` (required): Type of service requested
  - Options: Web Development, Backend/API Development, Mobile App Development, E-commerce Development, Maintenance/Support, Design, Consulting, Other
- `project_type` (legacy, optional): Old field for backward compatibility
- `budget_range` (optional): Client's budget range
- `deadline` (optional): Desired completion date
- `timeline` (optional): Expected project timeline
  - Options: 1-2 weeks, 2-4 weeks, 1-2 months, 2-3 months, 3-6 months, 6+ months, Flexible

### Requirements & Validation
- `requirements_accepted` (required): Boolean indicating client accepted requirements
- `requirements_accepted_at` (auto): Timestamp when requirements were accepted

### Quote Response
- `status` (required): Current status of quote
  - Options: Pending, Reviewed, Replied, Approved, Rejected, In Progress, Completed
- `estimated_amount` (optional): Admin-provided estimate
- `admin_response` (optional): Admin's response to client (sent via email)
- `notes` (optional): Internal notes (not visible to client)
- `assigned_to` (optional): Admin user assigned to handle quote

### Timestamps
- `created_at` (auto): When quote was submitted
- `updated_at` (auto): Last update timestamp
- `approved_at` (optional): When quote was approved
- `replied_at` (optional): When response email was sent

---

## API Endpoints

### Public Endpoints

#### `POST /api/quotes/`
**Permission**: `AllowAny` (public)

**Request Body**:
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "company_name": "Example Corp",
  "project_title": "E-commerce Website",
  "project_description": "Detailed description...",
  "service_type": "Web Development",
  "budget_range": "R 50,000 - R 100,000",
  "timeline": "2-3 months",
  "deadline": "2026-06-01",
  "requirements_accepted": true
}
```

**Response**: `201 Created` with quote data

**Validation**:
- `requirements_accepted` must be `true`
- Required fields must be provided
- Email format validation

**Automated Actions**:
- Sends confirmation email to client
- Sends notification email to admins
- Sets `requirements_accepted_at` timestamp

### Authenticated Endpoints

#### `GET /api/quotes/`
**Permission**: `IsAuthenticated`

Returns paginated list of all quotes.

#### `GET /api/quotes/{id}/`
**Permission**: `IsAuthenticated`

Returns specific quote details.

#### `PUT /api/quotes/{id}/` or `PATCH /api/quotes/{id}/`
**Permission**: `IsAuthenticated`

Update quote (admin only in practice).

**Automated Actions**:
- If status changes to "Replied" and `admin_response` exists, sends response email

#### `DELETE /api/quotes/{id}/`
**Permission**: `IsAuthenticated`

Delete a quote.

#### `POST /api/quotes/{id}/send_response/`
**Permission**: `IsAuthenticated`

Manually trigger sending of response email.

**Requirements**:
- `admin_response` must be set

**Automated Actions**:
- Sends response email to client
- Updates status to "Replied" if not already
- Sets `replied_at` timestamp

#### `POST /api/quotes/{id}/approve/`
**Permission**: `IsAuthenticated`

Approve a quote (sets status to "Approved").

#### `POST /api/quotes/{id}/reject/`
**Permission**: `IsAuthenticated`

Reject a quote (sets status to "Rejected").

---

## Email Templates

### Client Confirmation Email

**Subject**: `Quote Request Received - PathyCode`

**Content**:
- Greeting with client name
- Confirmation of receipt
- Project title
- Service type, budget range, timeline
- Expected response time (24-48 hours)

### Admin Notification Email

**Subject**: `New Quote Request: {project_title}`

**Recipients**: All superusers (or staff users if no superusers)

**Content**:
- Client information
- Project details
- Project description (truncated to 500 chars)
- Quote ID for reference

### Client Response Email

**Subject**: `Response to Your Quote Request: {project_title}`

**Content**:
- Greeting with client name
- Admin's response text
- Estimated amount (if provided)
- Contact information

---

## Frontend Pages

### `/requirements`
**Access**: Public

Displays comprehensive requirements information:
- Services offered
- Required information
- Pricing approach
- Expected timelines
- Terms & conditions

Includes link to quote request form.

### `/request-quote`
**Access**: Public

Quote request submission form:
- Client information fields
- Project details
- Service type dropdown (required)
- Timeline dropdown
- Budget range
- Requirements acceptance checkbox (required)
- Link to requirements page

On successful submission, redirects to `/quote-success`.

### `/quote-success`
**Access**: Public

Success page displayed after quote submission:
- Confirmation message
- Project title
- Client email confirmation
- Next steps information
- Links to submit another request or return home

### `/admin/quotes`
**Access**: Authenticated + Superuser

Admin panel for managing quotes:
- View all quotes with filters
- Search functionality
- Status filter
- View quote details
- Edit quotes
- Add admin response
- Send response emails
- Assign quotes to team members
- Approve/reject quotes

---

## Django Admin

The Django Admin interface provides additional functionality:

### Features
- List view with filters (status, service type, requirements accepted, date, assigned to)
- Search (project title, client name, email, company, description, admin response)
- Detailed form with organized fieldsets
- "Send Response" button in admin interface
- Read-only timestamp fields

### Field Organization
1. **Client Information**: Contact details
2. **Project Details**: Project information and requirements
3. **Requirements**: Acceptance status
4. **Quote Response**: Status, estimate, admin response, assignment
5. **Timestamps**: All timestamp fields (collapsed by default)

---

## Security & Access Control

### Public Access
- Quote submission (`POST /api/quotes/`)
- Requirements page
- Quote request form
- Success page

### Authenticated Access Required
- Viewing quotes (`GET /api/quotes/`)
- Updating quotes (`PUT/PATCH /api/quotes/{id}/`)
- Deleting quotes (`DELETE /api/quotes/{id}/`)
- All admin actions

### Best Practices
- Backend enforces authentication (not just frontend)
- Requirements acceptance validated on backend
- Email sending errors don't fail quote creation
- Admin response emails only sent when explicitly triggered or status changes

---

## Error Handling

### Quote Submission Errors
- Missing required fields → 400 Bad Request
- Invalid email format → 400 Bad Request
- Requirements not accepted → 400 Bad Request with error message

### Email Errors
- Email sending failures are logged but don't fail the operation
- Errors printed to console (development) or logged (production)

### API Errors
- Unauthenticated requests → 401 Unauthorized
- Invalid quote ID → 404 Not Found
- Validation errors → 400 Bad Request with field-specific errors

---

## Testing Checklist

### Backend Testing
- [ ] Public quote submission works
- [ ] Requirements acceptance validation works
- [ ] Confirmation email sent to client
- [ ] Admin notification email sent
- [ ] Authenticated users can view quotes
- [ ] Admin can update quotes
- [ ] Admin response email sent when status changes to "Replied"
- [ ] Manual send response endpoint works
- [ ] All status transitions work correctly

### Frontend Testing
- [ ] Requirements page displays correctly
- [ ] Quote form validates all fields
- [ ] Requirements checkbox prevents submission
- [ ] Success page displays after submission
- [ ] Admin panel shows all quote fields
- [ ] Admin can add response and send email
- [ ] Status filter works correctly
- [ ] Search functionality works

### Email Testing
- [ ] Client confirmation email received
- [ ] Admin notification email received
- [ ] Response email sent correctly
- [ ] Email content is accurate
- [ ] Email errors don't break workflow

---

## Future Enhancements

Potential improvements for the quote system:

1. **Email Templates**: Use Django templates for HTML emails
2. **Email Queue**: Use Celery for async email sending
3. **Quote PDF Generation**: Generate PDF quotes for clients
4. **Quote History**: Track all status changes and responses
5. **Client Portal**: Allow clients to view their quote status
6. **Quote Expiration**: Auto-expire quotes after 30 days
7. **Quote Templates**: Pre-filled templates for common projects
8. **Integration**: Integrate with invoicing system

---

**Last Updated**: January 2026  
**Version**: 2.0
