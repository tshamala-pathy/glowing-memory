"""
Custom exception handling for the API.

Provides a clear permission message when unauthenticated users try to access
Client Portal endpoints (quotes, invoices, projects). Frontends can use this
to show a message or redirect to login.
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import NotAuthenticated


# Message shown when authentication is required (e.g. Client Portal)
UNAUTHENTICATED_MESSAGE = (
    "Authentication required. Please log in to access this resource."
)


def custom_exception_handler(exc, context):
    """
    Call DRF's default handler, then replace the 401 detail with a clear
    message so the frontend can show or redirect to login.
    """
    response = exception_handler(exc, context)
    if response is not None and response.status_code == 401:
        if isinstance(exc, NotAuthenticated):
            response.data = {"detail": UNAUTHENTICATED_MESSAGE}
    return response
