"""
PayFast payment integration views.

Handles payment initiation, PayFast redirect, ITN (Instant Transaction Notification)
callbacks, success/cancel pages, and local-dev simulate-itn fallback.

Flow:
  1. Client initiates payment via API or /payments/pay/<quote_id>/
  2. Backend creates Payment (pending), builds PayFast URL with return_url, cancel_url, notify_url
  3. Client is redirected to PayFast to enter card details
  4. PayFast processes payment and:
     a) Redirects user's browser to return_url (success page)
     b) Sends server-to-server POST to notify_url (ITN) - requires public URL
  5. ITN handler creates Invoice, marks quote paid; clients.signals creates Project
  6. Local dev: PayFast cannot reach localhost, so success page shows "Complete payment locally"
     button that calls simulate_itn to run the same logic
"""
from decimal import Decimal

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from urllib.parse import urlencode

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from quotes.models import Quote
from invoices.models import Invoice
from clients.models import Client
from .models import Payment


def _process_payment_complete(quote, payment, provider_reference=""):
    """
    Apply payment-complete logic: update payment, create invoice, create project, mark quote paid.

    Called by payfast_notify (ITN) and simulate_itn (local dev). Order matters:
    Invoice model requires quote.status == 'approved', so we create invoice before
    marking quote as paid. The clients.signals pre_save on Invoice creates the Project
    when status changes to 'paid'.

    Args:
        quote: Quote instance (must be approved)
        payment: Payment instance (will be marked paid)
        provider_reference: PayFast transaction ID or 'simulated-itn' for local dev
    """
    # Mark payment as paid and store provider reference (e.g. PayFast pf_payment_id)
    payment.payment_status = Payment.STATUS_PAID
    payment.provider_reference = provider_reference
    payment.save(update_fields=["payment_status", "provider_reference"])

    # Create invoice BEFORE marking quote as paid (Invoice.save() validates quote.status == 'approved')
    invoice = Invoice(quote=quote, created_by=None)
    invoice.save()
    # Mark invoice as paid; clients.signals.create_project_on_invoice_paid runs on this save
    invoice.status = "paid"
    invoice.amount_paid = invoice.total_amount
    invoice.amount_due = Decimal("0.00")
    invoice.paid_date = invoice.issue_date
    invoice.paid_at = None
    invoice.save()

    # Mark quote as paid (after invoice created; Project already created by signal)
    quote.status = "paid"
    quote.save(update_fields=["status"])


def _build_payfast_redirect_url(quote, payment):
    """
    Build the PayFast redirect URL for a given quote and payment.

    Used by both create_payfast_payment (session-based) and StartPayFastPaymentView (API).
    Appends quote_id and payment_id to return/cancel URLs so the success page can show
    the "Complete payment locally" button when PayFast ITN cannot reach localhost.

    Returns:
        str: Full PayFast sandbox/process URL with query params
    """
    amount = payment.amount
    base_return = (settings.PAYFAST_RETURN_URL or "").rstrip("/")
    base_cancel = (settings.PAYFAST_CANCEL_URL or "").rstrip("/")
    # Append quote_id and payment_id so success page can trigger simulate_itn when needed
    return_url = f"{base_return}?quote_id={quote.id}&payment_id={payment.id}" if base_return else base_return
    cancel_url = f"{base_cancel}?quote_id={quote.id}&payment_id={payment.id}" if base_cancel else base_cancel
    # PayFast expects these fields; custom_str1/2 are echoed back in ITN POST for lookup
    payfast_data = {
        "merchant_id": settings.PAYFAST_MERCHANT_ID,
        "merchant_key": settings.PAYFAST_MERCHANT_KEY,
        "amount": str(amount),
        "item_name": quote.project_title or f"Quote {quote.id}",
        "return_url": return_url or base_return,  # Where user is redirected after payment
        "cancel_url": cancel_url or base_cancel,  # Where user is redirected if they cancel
        "notify_url": settings.PAYFAST_NOTIFY_URL,  # Server-to-server ITN callback (must be public)
        "custom_str1": str(quote.id),   # Echoed in ITN for quote lookup
        "custom_str2": str(payment.id), # Echoed in ITN for payment lookup
    }
    query_string = urlencode(payfast_data)
    return f"{settings.PAYFAST_SANDBOX_URL}?{query_string}"


class StartPayFastPaymentView(APIView):
    """
    API: Start PayFast payment for an approved quote.

    Endpoint: GET or POST /api/payment/quote/<quote_id>/start-pay/
    Requires JWT. Returns { redirect_url } so the frontend can redirect the user
    to PayFast for card entry. Creates a pending Payment record before redirect.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, quote_id):
        return self._start(request, quote_id)

    def post(self, request, quote_id):
        return self._start(request, quote_id)

    def _start(self, request, quote_id):
        # Fetch quote and validate access (owner or admin)
        try:
            quote = Quote.objects.get(pk=quote_id)
        except Quote.DoesNotExist:
            return Response({"error": "Quote not found."}, status=status.HTTP_404_NOT_FOUND)
        if not (request.user.is_staff or request.user.is_superuser):
            profile = getattr(request.user, "client_profile", None)
            if not profile or quote.client_id != profile.id:
                return Response({"error": "You do not have access to this quote."}, status=status.HTTP_403_FORBIDDEN)
        if quote.status != "approved":
            return Response({"error": "Only approved quotes can be paid."}, status=status.HTTP_400_BAD_REQUEST)
        amount = quote.estimated_amount or Decimal("0.00")
        if amount <= 0:
            return Response({"error": "Invalid quote amount for payment."}, status=status.HTTP_400_BAD_REQUEST)
        # Create pending payment and build PayFast redirect URL
        client = quote.client or getattr(request.user, "client_profile", None)
        payment = Payment.objects.create(
            client=client,
            user=request.user,
            quote=quote,
            amount=amount,
            payment_status=Payment.STATUS_PENDING,
            provider_reference="",
        )
        redirect_url = _build_payfast_redirect_url(quote, payment)
        return Response({"redirect_url": redirect_url})


@login_required
def create_payfast_payment(request, quote_id):
    """
    Start a PayFast payment for an approved quote (session-based flow).

    Endpoint: GET /payments/pay/<quote_id>/
    - Only works for approved quotes.
    - Creates a Payment record with status 'pending'.
    - Redirects user to PayFast sandbox URL for card entry.
    - Requires Django session auth (login_required).
    """
    quote = get_object_or_404(Quote, pk=quote_id)

    # Ownership/permission: allow quote owner (client) or admin
    if not (request.user.is_staff or request.user.is_superuser):
        profile = getattr(request.user, "client_profile", None)
        if not profile or quote.client_id != profile.id:
            return HttpResponse("You do not have access to this quote.", status=403)

    if quote.status != "approved":
        return HttpResponse("Only approved quotes can be paid.", status=400)

    amount = quote.estimated_amount or Decimal("0.00")
    if amount <= 0:
        return HttpResponse("Invalid quote amount for payment.", status=400)

    client = quote.client or getattr(request.user, "client_profile", None)

    payment = Payment.objects.create(
        client=client,
        user=request.user,
        quote=quote,
        amount=amount,
        payment_status=Payment.STATUS_PENDING,
        provider_reference="",
    )
    redirect_url = _build_payfast_redirect_url(quote, payment)
    return HttpResponseRedirect(redirect_url)


@csrf_exempt
def payfast_notify(request):
    """
    PayFast ITN (Instant Transaction Notification) endpoint.

    Endpoint: POST /payments/notify/
    PayFast sends a server-to-server POST when payment completes. This URL must be
    publicly reachable (PayFast cannot reach localhost). For local dev, use
    simulate_itn instead.

    NOTE: For production, implement full ITN security (signature verification) per
    PayFast docs. This implementation only demonstrates the workflow.
    """
    if request.method != "POST":
        return HttpResponse("Invalid method", status=405)

    # PayFast echoes custom_str1/2 from the original payment request
    quote_id = request.POST.get("custom_str1")
    payment_id = request.POST.get("custom_str2")
    payment_status = request.POST.get("payment_status", "").lower()
    pf_payment_id = request.POST.get("pf_payment_id", "")

    if not quote_id or not payment_id:
        return HttpResponse("Missing custom fields", status=400)

    try:
        quote = Quote.objects.get(pk=int(quote_id))
        payment = Payment.objects.get(pk=int(payment_id), quote=quote)
    except (Quote.DoesNotExist, Payment.DoesNotExist):
        return HttpResponse("Not found", status=404)

    if payment_status == "complete":
        _process_payment_complete(quote, payment, pf_payment_id)
    elif payment_status == "failed":
        payment.payment_status = Payment.STATUS_FAILED
        payment.provider_reference = pf_payment_id
        payment.save(update_fields=["payment_status", "provider_reference"])

    # Always return 200 so PayFast stops retrying (avoids duplicate ITN attempts)
    return HttpResponse("OK")


def payment_success(request):
    """
    Payment success page shown after PayFast redirects the user back.

    Endpoint: GET /payments/success/?quote_id=X&payment_id=Y
    When DEBUG and quote_id/payment_id are present, shows "Complete payment locally"
    button (PayFast ITN cannot reach localhost). Otherwise shows standard success message.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/") or "/"
    quote_id = request.GET.get("quote_id")
    payment_id = request.GET.get("payment_id")
    # Show simulate button only in local dev when we have IDs (return_url includes them)
    show_simulate = (
        settings.DEBUG
        and quote_id
        and payment_id
    )
    return render(
        request,
        "payments/payment_success.html",
        {
            "frontend_url": frontend_url,
            "portal_path": "/portal",
            "profile_path": "/profile",
            "home_path": "/",
            "show_simulate": show_simulate,
            "quote_id": quote_id,
            "payment_id": payment_id,
        },
    )


def simulate_itn(request):
    """
    Local dev only: simulate PayFast ITN when notify_url is unreachable (e.g. localhost).

    Endpoint: GET /payments/simulate-itn/?quote_id=X&payment_id=Y
    Only available when DEBUG=True. Runs the same logic as payfast_notify for
    payment_status=complete: creates Invoice, marks quote paid, triggers Project
    creation via clients.signals. Redirects to portal on success.
    """
    if not settings.DEBUG:
        return HttpResponse("Not available", status=404)

    quote_id = request.GET.get("quote_id") or request.POST.get("quote_id")
    payment_id = request.GET.get("payment_id") or request.POST.get("payment_id")
    if not quote_id or not payment_id:
        return HttpResponse("Missing quote_id or payment_id", status=400)

    try:
        quote = Quote.objects.get(pk=int(quote_id))
        payment = Payment.objects.get(pk=int(payment_id), quote=quote)
    except (Quote.DoesNotExist, Payment.DoesNotExist):
        return HttpResponse("Quote or payment not found", status=404)

    # Idempotent: if already paid, just redirect to portal
    if payment.payment_status == Payment.STATUS_PAID:
        return HttpResponseRedirect(
            f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/portal"
        )

    _process_payment_complete(quote, payment, provider_reference="simulated-itn")
    return HttpResponseRedirect(
        f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/portal"
    )


def payment_cancel(request):
    """
    Payment cancelled page shown when user cancels on PayFast.
    Endpoint: GET /payments/cancel/
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "").rstrip("/") or "/"
    return render(
        request,
        "payments/payment_cancel.html",
        {"frontend_url": frontend_url, "portal_path": "/portal", "profile_path": "/profile", "home_path": "/"},
    )

