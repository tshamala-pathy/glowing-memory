# Quotes Workflow Documentation

For the full **Quote → Payment → Invoice → Project** flow, see [QUOTE_TO_PROJECT_WORKFLOW.md](QUOTE_TO_PROJECT_WORKFLOW.md).

## Overview

The Quotes application allows authenticated users to request project quotes/estimates, and administrators to manage and respond to these requests through the Django admin panel.

## User Workflow

### 1. Requesting a Quote

**Prerequisites**: User must be authenticated (logged in)

**Steps**:
1. User navigates to `/quotes` page (link visible only when authenticated)
2. User fills out the quote request form with:
   - Client Information: Name, Email, Phone, Company
   - Project Details: Title, Description, Type, Budget Range, Deadline
3. User submits the form
4. System creates a Quote record with status='Pending'
5. User sees confirmation message

**Code Location**: `frontend/src/pages/Quotes.js`

### 2. API Endpoint

**Endpoint**: `POST /api/quotes/`

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "company_name": "Acme Corp",
  "project_title": "E-commerce Website",
  "project_description": "Need a full-featured e-commerce site...",
  "project_type": "Web Development",
  "budget_range": "R 50,000 - R 100,000",
  "deadline": "2024-12-31"
}
```

**Response**: 201 Created with quote details

## Admin Workflow

### Accessing Quotes in Admin Panel

1. Log in as superuser/admin
2. Navigate to Django admin panel: `/admin`
3. Click on "Quotes" in the admin dashboard
4. View all quote requests in a list

### Managing Quotes

**List View Features**:
- **Filters**: Filter by status, creation date, project type
- **Search**: Search by project title, client name, client email, project description
- **Columns**: Shows project title, client name, email, status, estimated amount, creation date

**Detail View Features**:
- **Client Information Section**: View/edit client contact details
- **Project Details Section**: View project requirements and specifications
- **Quote Information Section**:
  - Add estimated amount
  - Update status (Pending, Approved, Rejected, In Progress, Completed)
  - Add internal notes
  - Assign quote to team member
- **Timestamps**: View creation, update, and approval dates

### Status Workflow

```
Pending → Approved/Rejected/In Progress
              ↓
         Completed (optional)
```

**Status Meanings**:
- **Pending**: New quote request, awaiting review
- **Approved**: Quote has been approved, work can begin
- **Rejected**: Quote request was declined
- **In Progress**: Quote is being processed/worked on
- **Completed**: Quote process is finished

### Best Practices

1. **Review Timeline**: Check pending quotes regularly
2. **Add Notes**: Document any important details or client conversations
3. **Assign Team Members**: Use `assigned_to` field to track responsibility
4. **Update Status**: Keep status current to track workflow
5. **Estimated Amount**: Add estimated cost once calculated

## Database Model

**Model Location**: `quotes/models.py`

**Key Fields**:
- `client_name`, `client_email`, `client_phone`, `company_name` - Client info
- `project_title`, `project_description`, `project_type` - Project details
- `budget_range`, `deadline` - Project constraints
- `estimated_amount` - Admin-added quote amount
- `status` - Workflow status (choices defined in model)
- `notes` - Internal admin notes
- `assigned_to` - ForeignKey to User model
- `created_at`, `updated_at`, `approved_at` - Timestamps

## Admin Configuration

**Location**: `quotes/admin.py`

**Features**:
- Custom list display with key fields
- Filtering by status, date, project type
- Search functionality
- Organized fieldsets for better UX
- Read-only timestamp fields

## API Implementation

**ViewSet**: `quotes/views.py` (if exists)

The quotes can be managed via:
- Django Admin Panel (primary method for admins)
- REST API endpoints (if ViewSet is implemented)

**Permissions**:
- Create: Authenticated users only
- Read/Update/Delete: Admin users only (via admin panel)

## Frontend Integration

**Quote Request Page**: `frontend/src/pages/Quotes.js`
- Protected route (requires authentication)
- Pre-fills user information if available
- Validates form inputs
- Shows success/error messages

**Admin Quotes Page**: `frontend/src/pages/admin/AdminQuotes.js`
- Shows list of all quotes
- Allows filtering and searching
- Displays quote details
- Accessible only to superusers

## Troubleshooting

### User Cannot Access Quotes Page
- Verify user is authenticated (logged in)
- Check that route is protected with `requireAuth={true}`
- Verify JWT token is valid

### Quotes Not Appearing in Admin
- Ensure user is a superuser (`is_superuser=True`)
- Check that `quotes` app is in `INSTALLED_APPS` in settings.py
- Verify admin registration in `quotes/admin.py`

### Form Submission Fails
- Check browser console for API errors
- Verify backend is running
- Check authentication token is valid
- Ensure all required fields are filled

