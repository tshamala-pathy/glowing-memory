"""
Build aggregated profile payload for a user (quotes, invoices, projects, etc.).

Used by GET /api/profile/ (current user) and GET /api/users/admin/{id}/360/ (superuser).
"""
from django.db.models import Q


def build_profile_aggregate(user, request, *, admin_context=False, list_limit=50):
    """
    Build the aggregated profile payload for a user account.

    Used by ``GET /api/profile/`` (current user) and
    ``GET /api/users/admin/{id}/360/`` (superuser client 360 view).

    Args:
        user: Authenticated ``CustomUser`` whose data is being assembled.
        request: DRF request (passed to serializers for absolute URLs).
        admin_context (bool): When ``True``, include threads, case studies,
            activity log, payments, and extended stats for admin tooling.
        list_limit (int): Maximum rows per related collection (default 50).

    Returns:
        dict: Nested payload with ``user``, ``client``, ``quotes``, ``invoices``,
        ``projects``, ``messages``, ``testimonials``, and ``stats`` keys.
        Admin-only sections are included when ``admin_context`` is ``True``.
    """
    from clients.models import Client, Project
    from clients.serializers import ClientSerializer, ProjectSerializer, CaseStudySerializer
    from contact.models import ContactMessage
    from contact.serializers import ContactMessageSerializer
    from quotes.models import Quote
    from quotes.serializers import ProfileQuoteSerializer
    from invoices.models import Invoice
    from invoices.serializers import InvoiceSerializer
    from testimonials.models import Testimonial
    from testimonials.serializers import TestimonialSerializer
    from users.serializers import UserSerializer, ActivityLogSerializer

    user_data = UserSerializer(user, context={'request': request}).data

    profile = None
    try:
        profile = user.client_profile
    except Client.DoesNotExist:
        profile = None

    client_data = None
    if profile:
        client_data = ClientSerializer(profile, context={'request': request}).data
        if admin_context:
            client_data['user_id'] = user.id

    if profile:
        messages_qs = ContactMessage.objects.filter(client=profile).order_by('-created_at')
    else:
        messages_qs = ContactMessage.objects.filter(email__iexact=user.email).order_by('-created_at')
    messages_count = messages_qs.count()
    messages_data = ContactMessageSerializer(messages_qs[:list_limit], many=True).data

    if profile:
        quotes_qs = Quote.objects.filter(
            Q(client=profile) | Q(client__isnull=True, client_email__iexact=user.email)
        ).order_by('-created_at')
    else:
        quotes_qs = Quote.objects.filter(client_email__iexact=user.email).order_by('-created_at')
    quotes_list = list(quotes_qs[:list_limit])
    quotes_data = ProfileQuoteSerializer(
        quotes_list, many=True, context={'request': request}
    ).data

    if profile:
        invoices_qs = Invoice.objects.filter(
            Q(client=profile) | Q(client__isnull=True, client_email__iexact=user.email)
        ).order_by('-created_at')
    else:
        invoices_qs = Invoice.objects.filter(client_email__iexact=user.email).order_by('-created_at')
    invoices_list = list(invoices_qs[:list_limit])
    invoices_data = InvoiceSerializer(
        invoices_list, many=True, context={'request': request}
    ).data

    projects_data = []
    projects_count = 0
    if profile:
        projects_qs = Project.objects.filter(client=profile).select_related(
            'client', 'quote', 'invoice'
        ).order_by('-created_at')
        projects_count = projects_qs.count()
        projects_data = ProjectSerializer(
            projects_qs[:list_limit], many=True, context={'request': request}
        ).data

    testimonials_data = []
    testimonials_count = 0
    if profile:
        testimonials_qs = Testimonial.objects.filter(client=profile).order_by('-created_at')
        testimonials_count = testimonials_qs.count()
        testimonials_data = TestimonialSerializer(
            testimonials_qs[:list_limit], many=True, context={'request': request}
        ).data

    payments_count = 0
    payments_data = []
    if profile:
        from payments.models import Payment as ExternalPayment

        payments_qs = ExternalPayment.objects.filter(client=profile).select_related('quote').order_by('-created_at')
        payments_count = payments_qs.count()
        payments_data = [
            {
                'id': p.id,
                'amount': str(p.amount),
                'currency': p.currency,
                'payment_status': p.payment_status,
                'quote_id': p.quote_id,
                'quote_title': getattr(p.quote, 'project_title', None) if p.quote else None,
                'provider_reference': p.provider_reference or '',
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'created_at': p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments_qs[:list_limit]
        ]

    payload = {
        'user': user_data,
        'client': client_data,
        'quotes': quotes_data,
        'invoices': invoices_data,
        'projects': projects_data,
        'messages': messages_data,
        'testimonials': testimonials_data,
        'stats': {
            'total_projects': projects_count,
            'total_quotes': quotes_qs.count(),
            'total_invoices': invoices_qs.count(),
            'total_payments': payments_count,
            'total_messages': messages_count,
            'total_testimonials': testimonials_count,
        },
    }

    if admin_context:
        threads_data = []
        case_studies_data = []
        activity_data = []
        threads_count = 0
        case_studies_count = 0

        if profile:
            from messaging.models import MessageThread
            from messaging.serializers import MessageThreadSerializer
            from clients.models import CaseStudy

            threads_qs = MessageThread.objects.filter(client=profile).select_related(
                'project', 'client'
            ).order_by('-updated_at')
            threads_count = threads_qs.count()
            threads_data = MessageThreadSerializer(
                threads_qs[:list_limit], many=True, context={'request': request}
            ).data

            case_studies_qs = CaseStudy.objects.filter(client=profile).order_by('-created_at')
            case_studies_count = case_studies_qs.count()
            case_studies_data = CaseStudySerializer(
                case_studies_qs[:list_limit], many=True, context={'request': request}
            ).data

        from users.models import ActivityLog

        activity_qs = ActivityLog.objects.filter(user=user).order_by('-timestamp')
        activity_data = ActivityLogSerializer(
            activity_qs[:list_limit], many=True
        ).data

        payload['threads'] = threads_data
        payload['case_studies'] = case_studies_data
        payload['activity'] = activity_data
        payload['payments'] = payments_data
        payload['stats']['total_threads'] = threads_count
        payload['stats']['total_case_studies'] = case_studies_count
        payload['stats']['total_activity'] = activity_qs.count()

    return payload
