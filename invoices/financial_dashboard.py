"""
Financial dashboard metrics for admin/staff.
"""
import io
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Avg, Count, F, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from clients.models import Project
from quotes.models import Quote

DASHBOARD_PDF_DESCRIPTION = (
    'This report provides an internal financial overview for the selected period, '
    'including revenue collected, VAT, outstanding balances, quote pipeline activity, '
    'upcoming invoice due dates, and recent collections.'
)

_PDF_COLORS = {
    'primary': colors.HexColor('#0f172a'),
    'primary_light': colors.HexColor('#1e293b'),
    'accent': colors.HexColor('#4f46e5'),
    'accent_light': colors.HexColor('#eef2ff'),
    'success': colors.HexColor('#059669'),
    'success_light': colors.HexColor('#ecfdf5'),
    'warning': colors.HexColor('#d97706'),
    'warning_light': colors.HexColor('#fffbeb'),
    'danger': colors.HexColor('#e11d48'),
    'danger_light': colors.HexColor('#fff1f2'),
    'info': colors.HexColor('#0284c7'),
    'info_light': colors.HexColor('#f0f9ff'),
    'violet': colors.HexColor('#7c3aed'),
    'violet_light': colors.HexColor('#f5f3ff'),
    'muted': colors.HexColor('#64748b'),
    'border': colors.HexColor('#e2e8f0'),
    'row_alt': colors.HexColor('#f8fafc'),
    'white': colors.white,
}

_FUNNEL_STAGE_COLORS = [
    ('#fef3c7', '#92400e'),
    ('#e0e7ff', '#3730a3'),
    ('#dbeafe', '#1d4ed8'),
    ('#d1fae5', '#047857'),
    ('#ffe4e6', '#be123c'),
]


def _float(value):
    if value is None:
        return 0.0
    return float(value)


def _quote_amount(quote):
    return quote.estimated_amount or Decimal('0.00')


def _pct(numerator, denominator):
    if not denominator:
        return None
    return round((numerator / denominator) * 100, 1)


def resolve_date_range(period, start_str=None, end_str=None, today=None):
    """Return (start_date, end_date, label). start/end may be None for all-time."""
    today = today or timezone.now().date()

    if period == 'custom' and start_str and end_str:
        try:
            start = date.fromisoformat(start_str)
            end = date.fromisoformat(end_str)
            if start > end:
                start, end = end, start
            return start, end, f'{start.isoformat()} – {end.isoformat()}'
        except ValueError:
            pass

    if period == 'quarter':
        quarter_start_month = ((today.month - 1) // 3) * 3 + 1
        start = date(today.year, quarter_start_month, 1)
        end = today
        label = f'Q{((today.month - 1) // 3) + 1} {today.year}'
        return start, end, label

    if period == 'year':
        start = date(today.year, 1, 1)
        end = today
        return start, end, str(today.year)

    if period == 'all':
        return None, None, 'All time'

    # default: this month
    start = date(today.year, today.month, 1)
    end = today
    return start, end, start.strftime('%B %Y')


def _filter_paid_by_period(qs, start, end):
    if start is None or end is None:
        return qs
    return qs.filter(
        Q(paid_date__gte=start, paid_date__lte=end)
        | Q(paid_date__isnull=True, issue_date__gte=start, issue_date__lte=end)
    )


def _filter_quotes_by_period(qs, start, end):
    if start is None or end is None:
        return qs
    return qs.filter(created_at__date__gte=start, created_at__date__lte=end)


def _build_quote_funnel(quotes_qs):
    """
    Quote pipeline: Pending → Reviewed → Approved → Paid.

    Conversion rates measure step-to-step progression (not cumulative snapshot totals).
    Ancillary counts (changes requested, rejected) are included for admin context only.
    """
    pending = quotes_qs.filter(status='pending').count()
    reviewed = quotes_qs.filter(status='reviewed').count()
    approved = quotes_qs.filter(status='approved').count()
    paid = quotes_qs.filter(status='paid').count()
    changes_requested = quotes_qs.filter(status='changes_requested').count()
    rejected = quotes_qs.filter(status__in=('rejected', 'declined')).count()
    total = quotes_qs.count()

    stages = [
        {'key': 'pending', 'label': 'Pending', 'count': pending},
        {'key': 'reviewed', 'label': 'Reviewed', 'count': reviewed},
        {'key': 'approved', 'label': 'Approved', 'count': approved},
        {'key': 'paid', 'label': 'Paid', 'count': paid},
    ]

    past_pending = reviewed + approved + paid + rejected + changes_requested
    past_reviewed = approved + paid + rejected
    past_approved = approved + paid

    return {
        'total': total,
        'stages': stages,
        'ancillary': {
            'changes_requested': changes_requested,
            'rejected': rejected,
        },
        'conversion_rates': {
            'pending_to_reviewed': _pct(reviewed + approved + paid, past_pending or total),
            'reviewed_to_approved': _pct(approved + paid, past_reviewed or reviewed),
            'approved_to_paid': _pct(paid, past_approved or approved),
            'overall_win_rate': _pct(paid, paid + rejected) if (paid + rejected) else None,
        },
    }


def _build_revenue_by_service_type(paid_qs):
    """Paid invoice revenue grouped by linked quote service_type."""
    rows = (
        paid_qs.filter(quote__isnull=False)
        .values('quote__service_type')
        .annotate(revenue=Sum('total_amount'), invoice_count=Count('id'))
        .order_by('-revenue')
    )
    breakdown = []
    for row in rows:
        service = row['quote__service_type'] or 'Unspecified'
        breakdown.append({
            'service_type': service,
            'revenue': _float(row['revenue']),
            'invoice_count': row['invoice_count'] or 0,
        })
    return breakdown


def _build_reconciliation(InvoiceModel, ext_payments):
    """
    Flag PayFast ↔ invoice mismatches for support and audit.

    * paid_payment_open_invoice — PayFast marked paid but invoice still open
    * paid_invoice_no_payfast — Invoice paid with no matching PayFast record
    """
    open_statuses = ('paid', 'cancelled')
    mismatches = []

    paid_ext = ext_payments.filter(payment_status='paid').select_related('quote')
    for pay in paid_ext:
        inv = (
            InvoiceModel.objects.filter(quote_id=pay.quote_id)
            .exclude(status__in=open_statuses)
            .first()
        )
        if inv:
            mismatches.append({
                'type': 'paid_payment_open_invoice',
                'payment_id': pay.id,
                'invoice_id': inv.id,
                'quote_id': pay.quote_id,
                'title': inv.invoice_number or f'Invoice #{inv.id}',
                'client_name': inv.client_name,
                'amount': _float(pay.amount),
                'detail': 'PayFast payment marked paid but invoice is still open',
            })

    paid_invoices = InvoiceModel.objects.filter(status='paid').select_related('quote')
    for inv in paid_invoices:
        has_payfast = ext_payments.filter(
            quote_id=inv.quote_id,
            payment_status='paid',
        ).exists()
        if inv.quote_id and not has_payfast:
            mismatches.append({
                'type': 'paid_invoice_no_payfast',
                'payment_id': None,
                'invoice_id': inv.id,
                'quote_id': inv.quote_id,
                'title': inv.invoice_number or f'Invoice #{inv.id}',
                'client_name': inv.client_name,
                'amount': _float(inv.total_amount),
                'detail': 'Invoice marked paid but no matching PayFast record',
            })

    return {
        'mismatch_count': len(mismatches),
        'items': mismatches[:20],
    }


def _compute_dso(outstanding_balance, paid_qs, today, lookback_days=90):
    """
    Days Sales Outstanding: outstanding AR ÷ average daily revenue (recent period).

    Uses paid invoices in the last ``lookback_days`` as the revenue base.
    """
    lookback_start = today - timedelta(days=lookback_days)
    recent_revenue = _float(
        paid_qs.filter(
            Q(paid_date__gte=lookback_start, paid_date__lte=today)
            | Q(paid_date__isnull=True, issue_date__gte=lookback_start, issue_date__lte=today)
        ).aggregate(t=Sum('total_amount'))['t']
    )
    if outstanding_balance <= 0:
        return 0.0
    if recent_revenue <= 0:
        return None
    daily_revenue = recent_revenue / lookback_days
    return round(outstanding_balance / daily_revenue, 1)


def _build_client_health(*, paid_invoices_all, open_invoices, overdue_qs, ext_payments, today):
    """
    Simple client health score for relationship management.

    Green — pays on time, no overdue, no recent failed payments
    Amber — slow payer (open balance, not overdue) or mixed signals
    Red — overdue invoices and/or failed PayFast attempts
    """
    from clients.models import Client

    failed_by_client = {}
    for pay in ext_payments.filter(payment_status='failed').select_related('client'):
        cid = pay.client_id
        if cid:
            failed_by_client[cid] = failed_by_client.get(cid, 0) + 1

    clients_with_activity = set(
        paid_invoices_all.filter(client_id__isnull=False).values_list('client_id', flat=True)
    ) | set(open_invoices.filter(client_id__isnull=False).values_list('client_id', flat=True))

    health_rows = []
    for client in Client.objects.filter(id__in=clients_with_activity).only('id', 'name'):
        cid = client.id
        overdue_amt = _float(overdue_qs.filter(client_id=cid).aggregate(t=Sum('amount_due'))['t'])
        open_amt = _float(open_invoices.filter(client_id=cid).aggregate(t=Sum('amount_due'))['t'])
        failed_count = failed_by_client.get(cid, 0)
        revenue = _float(
            paid_invoices_all.filter(client_id=cid).aggregate(t=Sum('total_amount'))['t']
        )
        last_paid = (
            paid_invoices_all.filter(client_id=cid, paid_date__isnull=False)
            .order_by('-paid_date')
            .values_list('paid_date', flat=True)
            .first()
        )

        if overdue_amt > 0 or failed_count > 0:
            score = 'red'
            label = 'At risk'
        elif open_amt > 0:
            score = 'amber'
            label = 'Slow payer'
        else:
            score = 'green'
            label = 'Healthy'

        health_rows.append({
            'client_id': cid,
            'client_name': client.name or 'Unknown',
            'score': score,
            'label': label,
            'total_revenue': revenue,
            'outstanding_balance': open_amt,
            'overdue_balance': overdue_amt,
            'failed_payments': failed_count,
            'last_payment_date': last_paid.isoformat() if last_paid else None,
        })

    health_rows.sort(
        key=lambda row: (
            {'red': 0, 'amber': 1, 'green': 2}[row['score']],
            -row['overdue_balance'],
            -row['outstanding_balance'],
        )
    )
    return health_rows[:15]


def _build_cash_forecast(*, today, open_invoices, pipeline_quotes, ext_payments, horizon_days=30):
    """
    Expected cash-in for the next ``horizon_days`` from approved quotes,
    unpaid invoices with due dates, and pending PayFast attempts.
    """
    horizon_end = today + timedelta(days=horizon_days)
    forecast_items = []
    total = Decimal('0.00')

    for inv in open_invoices.filter(
        due_date__gte=today,
        due_date__lte=horizon_end,
    ).select_related('quote').order_by('due_date')[:25]:
        amt = inv.amount_due or Decimal('0.00')
        total += amt
        forecast_items.append({
            'type': 'invoice',
            'id': inv.id,
            'title': inv.invoice_number or f'Invoice #{inv.id}',
            'client_name': inv.client_name,
            'amount': _float(amt),
            'expected_date': inv.due_date.isoformat() if inv.due_date else None,
        })

    for quote in pipeline_quotes.only('id', 'project_title', 'client_name', 'estimated_amount', 'approved_at'):
        amt = _quote_amount(quote)
        total += amt
        forecast_items.append({
            'type': 'approved_quote',
            'id': quote.id,
            'title': quote.project_title or f'Quote #{quote.id}',
            'client_name': quote.client_name,
            'amount': _float(amt),
            'expected_date': None,
        })

    for pay in ext_payments.filter(
        payment_status__in=('pending', 'processing'),
    ).select_related('quote', 'client').order_by('-created_at')[:10]:
        amt = pay.amount or Decimal('0.00')
        total += amt
        forecast_items.append({
            'type': 'pending_payment',
            'id': pay.id,
            'title': getattr(pay.quote, 'project_title', None) or f'Quote #{pay.quote_id}',
            'client_name': getattr(pay.client, 'name', None) or '—',
            'amount': _float(amt),
            'expected_date': None,
        })

    return {
        'horizon_days': horizon_days,
        'expected_total': _float(total),
        'item_count': len(forecast_items),
        'items': forecast_items[:30],
    }


def _invoice_followup_actions(invoice_id):
    """Reminder / contact actions for open invoices awaiting payment."""
    return [
        {'key': 'open_invoice', 'label': 'Open invoice', 'href': f'/admin/invoices?invoice={invoice_id}'},
        {'key': 'send_reminder', 'label': 'Send reminder', 'method': 'POST', 'url': f'/invoices/{invoice_id}/send_reminder/'},
        {'key': 'mark_contacted', 'label': 'Mark contacted', 'method': 'POST', 'url': f'/invoices/{invoice_id}/mark_contacted/'},
    ]


def _quote_payment_actions(quote):
    """Follow-up actions for approved quotes awaiting payment (no invoice yet)."""
    payment_url = getattr(quote, 'payment_url', None) or f'/payment/{quote.id}'
    if payment_url.startswith('/'):
        base = getattr(settings, 'FRONTEND_URL', '').strip().rstrip('/')
        if base:
            payment_url = f'{base}{payment_url}'
    actions = [
        {'key': 'open_quote', 'label': 'Open quote', 'href': f'/admin/quotes?quote={quote.id}'},
        {'key': 'send_payment_reminder', 'label': 'Send payment reminder', 'method': 'POST', 'url': f'/quotes/{quote.id}/send_payment_reminder/'},
        {'key': 'mark_quote_contacted', 'label': 'Mark contacted', 'method': 'POST', 'url': f'/quotes/{quote.id}/mark_contacted/'},
    ]
    if payment_url:
        actions.insert(1, {'key': 'payment_page', 'label': 'Payment page', 'href': payment_url, 'external': True})
    return actions


def _collectible_open_invoices(open_invoices):
    """Open invoices that still expect client payment."""
    return (
        open_invoices.filter(
            Q(amount_due__gt=0) | Q(total_amount__gt=F('amount_paid'))
        )
        .exclude(total_amount=0)
        .select_related('quote')
    )


def _attention_actions(*, item_type, invoice_id=None, quote_id=None, payment_url=None):
    """Action metadata for the Needs attention work queue."""
    actions = []
    if item_type in ('overdue_invoice', 'pending_invoice') and invoice_id:
        actions.extend(_invoice_followup_actions(invoice_id))
    if item_type == 'approved_quote' and quote_id:
        from quotes.models import Quote
        try:
            quote = Quote.objects.get(pk=quote_id)
            actions.extend(_quote_payment_actions(quote))
        except Quote.DoesNotExist:
            actions.append({'key': 'open_quote', 'label': 'Open quote', 'href': f'/admin/quotes?quote={quote_id}'})
    if item_type == 'failed_payment' and quote_id:
        actions.append({'key': 'open_quote', 'label': 'Open quote', 'href': f'/admin/quotes?quote={quote_id}'})
        if payment_url:
            actions.append({'key': 'payment_page', 'label': 'Payment page', 'href': payment_url, 'external': True})
    return actions


def _payment_followup_item(inv, today):
    """Build one payment follow-up row for an open invoice."""
    is_overdue = bool(inv.due_date and inv.due_date < today)
    days_overdue = (today - inv.due_date).days if is_overdue and inv.due_date else None
    days_until = (inv.due_date - today).days if inv.due_date and not is_overdue else None
    amount_due = _float(inv.amount_due)
    if amount_due <= 0 and inv.total_amount:
        amount_due = _float(inv.total_amount - (inv.amount_paid or 0))
    return {
        'type': 'overdue_invoice' if is_overdue else 'pending_invoice',
        'id': inv.id,
        'quote_id': inv.quote_id,
        'title': inv.invoice_number or f'Invoice #{inv.id}',
        'client_name': inv.client_name,
        'amount': amount_due,
        'due_date': inv.due_date.isoformat() if inv.due_date else None,
        'days_overdue': days_overdue,
        'days_until_due': days_until,
        'status': inv.status,
        'project_title': getattr(inv.quote, 'project_title', None) if inv.quote else None,
        'blocks_project': True,
        'actions': _invoice_followup_actions(inv.id),
    }


def _quote_awaiting_payment_item(quote):
    """Approved quote with no invoice yet — client must pay to start the project."""
    return {
        'type': 'approved_quote',
        'id': quote.id,
        'quote_id': quote.id,
        'title': quote.project_title or f'Quote #{quote.id}',
        'client_name': quote.client_name,
        'amount': _float(_quote_amount(quote)),
        'due_date': None,
        'days_overdue': None,
        'days_until_due': None,
        'status': quote.status,
        'project_title': quote.project_title,
        'blocks_project': True,
        'approved_at': quote.approved_at.isoformat() if quote.approved_at else None,
        'actions': _quote_payment_actions(quote),
    }


FINANCE_ACTIVITY_LABELS = {
    'invoice_reminder_sent': 'Payment reminder sent',
    'invoice_contacted': 'Client marked as contacted',
    'invoice_marked_paid': 'Invoice marked paid',
    'invoice_created': 'Invoice created',
    'payment_completed': 'Payment completed',
    'payment_started': 'Payment started',
    'quote_payment_reminder_sent': 'Quote payment reminder sent',
    'quote_contacted': 'Quote follow-up recorded',
    'quote_approved': 'Quote approved',
}

FINANCE_ACTIVITY_ACTIONS = tuple(FINANCE_ACTIVITY_LABELS.keys())


def _build_finance_activity(limit=25):
    """Recent finance-related staff actions for the dashboard audit trail."""
    from users.models import ActivityLog

    qs = (
        ActivityLog.objects.filter(action__in=FINANCE_ACTIVITY_ACTIONS)
        .select_related('user')
        .order_by('-timestamp')[:limit]
    )
    items = []
    for log in qs:
        user = log.user
        user_name = (user.get_full_name() or '').strip() or getattr(user, 'username', '') or 'Staff'
        items.append({
            'id': log.id,
            'action': log.action,
            'label': FINANCE_ACTIVITY_LABELS.get(log.action, log.action.replace('_', ' ').title()),
            'user_name': user_name,
            'timestamp': log.timestamp.isoformat(),
            'object_type': log.object_type or '',
            'object_id': log.object_id,
            'details': log.details or '',
        })
    return items


def build_financial_dashboard(*, period='month', start_str=None, end_str=None, upcoming_days=14):
    """
    Build the full financial dashboard payload for admin/staff.

    Args:
        period: month | quarter | year | all | custom
        start_str / end_str: ISO dates when period=custom
        upcoming_days: horizon for upcoming-due invoices (7 or 14)
    """
    from invoices.models import Invoice
    from payments.models import Payment as ExternalPayment

    today = timezone.now().date()
    upcoming_days = 14 if upcoming_days not in (7, 14) else upcoming_days
    start, end, period_label = resolve_date_range(period, start_str, end_str, today)

    InvoiceModel = Invoice
    open_statuses = ('paid', 'cancelled')
    open_invoices = InvoiceModel.objects.exclude(status__in=open_statuses)
    paid_invoices_all = InvoiceModel.objects.filter(status='paid')
    paid_in_period = _filter_paid_by_period(paid_invoices_all, start, end)
    overdue_qs = InvoiceModel.objects.filter(due_date__lt=today).exclude(status__in=open_statuses)

    total_revenue = _float(paid_in_period.aggregate(t=Sum('total_amount'))['t'])
    period_revenue = total_revenue
    yearly_revenue = period_revenue if start else _float(
        paid_invoices_all.filter(paid_date__year=today.year).aggregate(t=Sum('total_amount'))['t']
    )

    vat_ytd = _float(
        paid_invoices_all.filter(paid_date__year=today.year).aggregate(t=Sum('vat_amount'))['t']
    )
    vat_summary = {
        'vat_collected': _float(paid_in_period.aggregate(t=Sum('vat_amount'))['t']),
        'vat_ytd': vat_ytd,
        'subtotal_collected': _float(paid_in_period.aggregate(t=Sum('subtotal'))['t']),
        'total_collected': total_revenue,
        'paid_invoice_count': paid_in_period.count(),
    }

    # Monthly buckets within selected period (or last 6 months for all-time)
    monthly_revenue = {}
    monthly_detail = []
    if start and end:
        cursor = date(start.year, start.month, 1)
        while cursor <= end:
            key = cursor.strftime('%Y-%m')
            month_end = (date(cursor.year + (cursor.month // 12), (cursor.month % 12) + 1, 1) - timedelta(days=1))
            range_end = min(month_end, end)
            month_total = _float(
                _filter_paid_by_period(paid_invoices_all, cursor, range_end).aggregate(t=Sum('total_amount'))['t']
            )
            monthly_revenue[key] = month_total
            monthly_detail.append({'month': key, 'revenue': month_total, 'change_pct': None})
            if cursor.month == 12:
                cursor = date(cursor.year + 1, 1, 1)
            else:
                cursor = date(cursor.year, cursor.month + 1, 1)
        monthly_detail.reverse()
        for idx in range(len(monthly_detail) - 1):
            cur = monthly_detail[idx]['revenue']
            prior = monthly_detail[idx + 1]['revenue']
            if prior > 0:
                monthly_detail[idx]['change_pct'] = round(((cur - prior) / prior) * 100, 1)
    else:
        month_totals = []
        for i in range(6):
            year = today.year
            month = today.month - i
            while month <= 0:
                month += 12
                year -= 1
            key = f'{year}-{month:02d}'
            month_total = _float(
                paid_invoices_all.filter(paid_date__year=year, paid_date__month=month).aggregate(t=Sum('total_amount'))['t']
            )
            if not month_total:
                month_total = _float(
                    paid_invoices_all.filter(
                        paid_date__isnull=True, issue_date__year=year, issue_date__month=month
                    ).aggregate(t=Sum('total_amount'))['t']
                )
            month_totals.append((key, month_total))
            monthly_revenue[key] = month_total
        monthly_revenue = dict(sorted(monthly_revenue.items(), key=lambda x: x[0], reverse=True))
        for idx, (key, month_total) in enumerate(month_totals):
            change_pct = None
            if idx + 1 < len(month_totals) and month_totals[idx + 1][1] > 0:
                change_pct = round(
                    ((month_total - month_totals[idx + 1][1]) / month_totals[idx + 1][1]) * 100, 1
                )
            monthly_detail.append({'month': key, 'revenue': month_total, 'change_pct': change_pct})

    current_month_revenue = monthly_detail[0]['revenue'] if monthly_detail else total_revenue
    revenue_mom_change_pct = monthly_detail[0].get('change_pct') if monthly_detail else None
    revenue_yoy_change_pct = None

    unpaid_invoices_total = _float(open_invoices.aggregate(t=Sum('amount_due'))['t'])
    overdue_invoices_total = _float(overdue_qs.aggregate(t=Sum('amount_due'))['t'])
    unpaid_invoices_count = open_invoices.count()
    overdue_invoices_count = overdue_qs.count()
    paid_invoices_count = paid_in_period.count()

    partial_qs = open_invoices.filter(amount_paid__gt=0, amount_due__gt=0)
    partially_paid_count = partial_qs.count()
    partially_paid_total = _float(partial_qs.aggregate(t=Sum('amount_due'))['t'])

    avg_invoice = paid_in_period.aggregate(avg=Avg('total_amount'))['avg']
    average_invoice_value = _float(avg_invoice)

    paid_with_dates = paid_in_period.filter(paid_date__isnull=False, issue_date__isnull=False)
    avg_days = None
    if paid_with_dates.exists():
        days_list = [
            (inv.paid_date - inv.issue_date).days
            for inv in paid_with_dates.only('issue_date', 'paid_date')
            if inv.paid_date and inv.issue_date
        ]
        if days_list:
            avg_days = round(sum(days_list) / len(days_list), 1)

    non_cancelled = InvoiceModel.objects.exclude(status='cancelled')
    invoiced_total = _float(non_cancelled.aggregate(t=Sum('total_amount'))['t'])
    collected_total = _float(non_cancelled.aggregate(t=Sum('amount_paid'))['t'])
    collection_rate_pct = round((collected_total / invoiced_total) * 100, 1) if invoiced_total > 0 else 0.0

    aging = {
        'days_0_30': {'count': 0, 'amount': 0.0},
        'days_31_60': {'count': 0, 'amount': 0.0},
        'days_60_plus': {'count': 0, 'amount': 0.0},
    }
    for inv in overdue_qs.only('due_date', 'amount_due'):
        if not inv.due_date:
            continue
        days = (today - inv.due_date).days
        amount = _float(inv.amount_due)
        bucket = 'days_0_30' if days <= 30 else 'days_31_60' if days <= 60 else 'days_60_plus'
        aging[bucket]['count'] += 1
        aging[bucket]['amount'] += amount

    upcoming_due = []
    upcoming_qs = open_invoices.filter(
        due_date__gte=today,
        due_date__lte=today + timedelta(days=upcoming_days),
    ).select_related('quote').order_by('due_date')[:15]
    for inv in upcoming_qs:
        upcoming_due.append({
            'id': inv.id,
            'invoice_number': inv.invoice_number or f'#{inv.id}',
            'client_name': inv.client_name,
            'amount_due': _float(inv.amount_due),
            'due_date': inv.due_date.isoformat() if inv.due_date else None,
            'days_until_due': (inv.due_date - today).days if inv.due_date else None,
            'status': inv.status,
            'project_title': getattr(inv.quote, 'project_title', None) if hasattr(inv, 'quote') else None,
            'actions': _invoice_followup_actions(inv.id),
        })

    revenue_by_service_type = _build_revenue_by_service_type(paid_in_period)

    quotes_qs = _filter_quotes_by_period(Quote.objects.all(), start, end)
    quote_funnel = _build_quote_funnel(quotes_qs)

    quote_ids_with_invoice = set(InvoiceModel.objects.values_list('quote_id', flat=True))
    pipeline_quotes = Quote.objects.filter(status='approved').exclude(id__in=quote_ids_with_invoice)
    pipeline_block = {
        'approved_unpaid_quotes_count': pipeline_quotes.count(),
        'approved_unpaid_quotes_total': sum(_float(_quote_amount(q)) for q in pipeline_quotes.only('estimated_amount')),
        'awaiting_payment': [
            {
                'id': q.id,
                'project_title': q.project_title or f'Quote #{q.id}',
                'client_name': q.client_name,
                'amount': _float(_quote_amount(q)),
                'approved_at': q.approved_at.isoformat() if q.approved_at else None,
                'payment_url': q.payment_url or f'/payment/{q.id}',
            }
            for q in pipeline_quotes.order_by('-approved_at', '-id')[:15]
        ],
    }

    month_start = today.replace(day=1)
    ext_payments = ExternalPayment.objects.all()
    paid_ext_qs = ext_payments.filter(payment_status=ExternalPayment.STATUS_PAID)
    if start and end:
        paid_ext_qs = paid_ext_qs.filter(paid_at__date__gte=start, paid_at__date__lte=end)
    else:
        paid_ext_qs = paid_ext_qs.filter(paid_at__date__gte=month_start)

    pending_ext = ext_payments.filter(
        payment_status__in=(ExternalPayment.STATUS_PENDING, ExternalPayment.STATUS_PROCESSING)
    )
    failed_ext = ext_payments.filter(payment_status=ExternalPayment.STATUS_FAILED)
    total_attempts = ext_payments.count()
    paid_attempts = ext_payments.filter(payment_status=ExternalPayment.STATUS_PAID).count()
    payments_block = {
        'paid_this_month_count': paid_ext_qs.count(),
        'paid_this_month_total': _float(paid_ext_qs.aggregate(t=Sum('amount'))['t']),
        'pending_count': pending_ext.count(),
        'pending_total': _float(pending_ext.aggregate(t=Sum('amount'))['t']),
        'failed_count': failed_ext.count(),
        'failed_total': _float(failed_ext.aggregate(t=Sum('amount'))['t']),
        'success_rate_pct': round((paid_attempts / total_attempts) * 100, 1) if total_attempts else 0.0,
    }

    reconciliation = _build_reconciliation(InvoiceModel, ext_payments)

    active_projects_count = Project.objects.exclude(status='completed').count()
    active_invoice_ids = (
        Project.objects.exclude(status='completed')
        .exclude(invoice_id__isnull=True)
        .values_list('invoice_id', flat=True)
    )
    active_project_revenue = _float(
        paid_invoices_all.filter(id__in=active_invoice_ids).aggregate(t=Sum('total_amount'))['t']
    )
    revenue_per_active_project = (
        round(active_project_revenue / active_projects_count, 2) if active_projects_count else None
    )

    dso_days = _compute_dso(unpaid_invoices_total, paid_invoices_all, today)

    client_health = _build_client_health(
        paid_invoices_all=paid_invoices_all,
        open_invoices=open_invoices,
        overdue_qs=overdue_qs,
        ext_payments=ext_payments,
        today=today,
    )

    cash_forecast = _build_cash_forecast(
        today=today,
        open_invoices=open_invoices,
        pipeline_quotes=pipeline_quotes,
        ext_payments=ext_payments,
    )

    smart_metrics = {
        'dso_days': dso_days,
        'revenue_per_active_project': revenue_per_active_project,
        'active_projects_count': active_projects_count,
        'average_days_to_paid': avg_days,
    }

    top_clients = []
    client_revenue = (
        paid_in_period.filter(client__isnull=False)
        .values('client_id', 'client__name')
        .annotate(revenue=Sum('total_amount'))
        .order_by('-revenue')[:5]
    )
    for row in client_revenue:
        cid = row['client_id']
        unpaid_bal = _float(open_invoices.filter(client_id=cid).aggregate(t=Sum('amount_due'))['t'])
        last_paid = (
            paid_invoices_all.filter(client_id=cid, paid_date__isnull=False)
            .order_by('-paid_date')
            .values_list('paid_date', flat=True)
            .first()
        )
        top_clients.append({
            'client_id': cid,
            'client_name': row['client__name'] or 'Unknown',
            'total_revenue': _float(row['revenue']),
            'unpaid_balance': unpaid_bal,
            'last_payment_date': last_paid.isoformat() if last_paid else None,
        })

    collectible_invoices = _collectible_open_invoices(open_invoices)

    needs_attention = []
    for inv in overdue_qs.select_related('quote').order_by('due_date')[:8]:
        item = _payment_followup_item(inv, today)
        item['actions'] = _attention_actions(item_type='overdue_invoice', invoice_id=inv.id)
        needs_attention.append(item)
    pending_payment_qs = (
        collectible_invoices
        .exclude(id__in=overdue_qs.values_list('id', flat=True))
        .order_by('due_date', 'id')[:8]
    )
    for inv in pending_payment_qs:
        item = _payment_followup_item(inv, today)
        item['actions'] = _attention_actions(item_type='pending_invoice', invoice_id=inv.id)
        needs_attention.append(item)
    for quote in pipeline_quotes.order_by('-approved_at', '-id')[:8]:
        item = _quote_awaiting_payment_item(quote)
        item['actions'] = _attention_actions(item_type='approved_quote', quote_id=quote.id)
        needs_attention.append(item)
    for pay in failed_ext.select_related('quote', 'client').order_by('-created_at')[:5]:
        payment_url = getattr(pay.quote, 'payment_url', None) if pay.quote else None
        needs_attention.append({
            'type': 'failed_payment',
            'id': pay.id,
            'quote_id': pay.quote_id,
            'title': getattr(pay.quote, 'project_title', None) or f'Quote #{pay.quote_id}',
            'client_name': getattr(pay.client, 'name', None) or '—',
            'amount': _float(pay.amount),
            'due_date': None,
            'days_overdue': None,
            'actions': _attention_actions(
                item_type='failed_payment',
                quote_id=pay.quote_id,
                payment_url=payment_url,
            ),
        })

    invoice_followups = [
        _payment_followup_item(inv, today)
        for inv in collectible_invoices.order_by('due_date', 'id')[:20]
    ]
    quote_followups = [
        _quote_awaiting_payment_item(q)
        for q in pipeline_quotes.order_by('-approved_at', '-id')[:20]
    ]
    payment_followups = invoice_followups + quote_followups

    finance_activity = _build_finance_activity()

    recent_collections = []
    for inv in paid_in_period.order_by('-paid_date', '-created_at')[:10]:
        recent_collections.append({
            'id': inv.id,
            'invoice_number': inv.invoice_number or f'#{inv.id}',
            'client_name': inv.client_name,
            'amount': _float(inv.total_amount),
            'vat_amount': _float(inv.vat_amount),
            'paid_date': inv.paid_date.isoformat() if inv.paid_date else None,
        })

    return {
        'period': period,
        'period_label': period_label,
        'start_date': start.isoformat() if start else None,
        'end_date': end.isoformat() if end else None,
        'upcoming_days': upcoming_days,
        'total_revenue': total_revenue,
        'yearly_revenue': yearly_revenue,
        'period_revenue': period_revenue,
        'monthly_revenue': monthly_revenue,
        'monthly_revenue_detail': monthly_detail,
        'current_month_revenue': current_month_revenue,
        'revenue_mom_change_pct': revenue_mom_change_pct,
        'revenue_yoy_change_pct': revenue_yoy_change_pct,
        'vat_summary': vat_summary,
        'quote_funnel': quote_funnel,
        'revenue_by_service_type': revenue_by_service_type,
        'reconciliation': reconciliation,
        'smart_metrics': smart_metrics,
        'client_health': client_health,
        'cash_forecast': cash_forecast,
        'upcoming_due': upcoming_due,
        'unpaid_invoices_total': unpaid_invoices_total,
        'outstanding_balance': unpaid_invoices_total,
        'unpaid_invoices_count': unpaid_invoices_count,
        'overdue_invoices_total': overdue_invoices_total,
        'overdue_invoices_count': overdue_invoices_count,
        'paid_invoices_count': paid_invoices_count,
        'partially_paid_count': partially_paid_count,
        'partially_paid_total': partially_paid_total,
        'average_invoice_value': average_invoice_value,
        'average_days_to_paid': avg_days,
        'collection_rate_pct': collection_rate_pct,
        'overdue_aging': aging,
        'payments': payments_block,
        'pipeline': pipeline_block,
        'active_projects_count': active_projects_count,
        'top_clients': top_clients,
        'needs_attention': needs_attention,
        'payment_followups': payment_followups,
        'finance_activity': finance_activity,
        'recent_collections': recent_collections,
    }


def _pdf_brand_header(styles, period_label, start_date=None, end_date=None):
    """Branded banner with logo, company name, and document purpose."""
    from invoices.utils import _get_company_logo

    elements = []
    brand_name = getattr(settings, 'BRAND_NAME', 'PathyCode')
    tagline = getattr(settings, 'COMPANY_TAGLINE', 'Business & financial operations')
    logo_path = _get_company_logo()

    banner_title_style = ParagraphStyle(
        'BannerTitle',
        parent=styles['Normal'],
        fontSize=20,
        textColor=_PDF_COLORS['white'],
        fontName='Helvetica-Bold',
        leading=24,
        spaceAfter=2,
    )
    banner_brand_style = ParagraphStyle(
        'BannerBrand',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#cbd5e1'),
        alignment=TA_RIGHT,
        leading=14,
    )

    left_cell = []
    if logo_path:
        try:
            left_cell.append(Image(logo_path, width=0.85 * inch, height=0.85 * inch))
        except Exception:
            left_cell.append(Paragraph(brand_name, banner_title_style))
    else:
        left_cell.append(Paragraph(brand_name, banner_title_style))

    period_detail = period_label
    if start_date and end_date:
        period_detail = f'{period_label}<br/><font size="8" color="#94a3b8">{start_date} – {end_date}</font>'

    banner_table = Table(
        [[
            left_cell[0] if left_cell else '',
            Paragraph(
                f'{brand_name}<br/><font size="9" color="#94a3b8">{tagline}</font>',
                banner_brand_style,
            ),
        ]],
        colWidths=[1.1 * inch, 4.9 * inch],
    )
    banner_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), _PDF_COLORS['primary']),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ])
    )
    elements.append(banner_table)

    hero_table = Table(
        [[
            Paragraph('Financial Dashboard Report', banner_title_style),
            Paragraph(period_detail, banner_brand_style),
        ]],
        colWidths=[3.4 * inch, 2.6 * inch],
    )
    hero_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), _PDF_COLORS['primary_light']),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ])
    )
    elements.append(hero_table)

    desc_box = Table(
        [[Paragraph(DASHBOARD_PDF_DESCRIPTION, ParagraphStyle(
            'DocDesc',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#334155'),
            leading=13,
        ))]],
        colWidths=[6 * inch],
    )
    desc_box.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), _PDF_COLORS['accent_light']),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#c7d2fe')),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ])
    )
    elements.append(desc_box)
    elements.append(Spacer(1, 0.22 * inch))
    return elements


def _pdf_kpi_cards(data):
    """Colored KPI highlight row."""
    vat = data.get('vat_summary') or {}
    cards = [
        ('Period revenue', _fmt_currency(data.get('period_revenue', data.get('total_revenue'))),
         _PDF_COLORS['success_light'], _PDF_COLORS['success']),
        ('Outstanding', _fmt_currency(data.get('unpaid_invoices_total')),
         _PDF_COLORS['warning_light'], _PDF_COLORS['warning']),
        ('Overdue', _fmt_currency(data.get('overdue_invoices_total')),
         _PDF_COLORS['danger_light'], _PDF_COLORS['danger']),
        ('Collection rate', f"{data.get('collection_rate_pct', 0)}%",
         _PDF_COLORS['accent_light'], _PDF_COLORS['accent']),
    ]

    label_style = ParagraphStyle('KpiLabel', fontSize=8, textColor=_PDF_COLORS['muted'], fontName='Helvetica')

    row_labels = [Paragraph(label.upper(), label_style) for label, _, _, _ in cards]
    row_values = [
        Paragraph(
            f'<font color="{color.hexval()}">{value}</font>',
            ParagraphStyle('KpiVal', fontSize=13, fontName='Helvetica-Bold'),
        )
        for _, value, _, color in cards
    ]

    table = Table([row_labels, row_values], colWidths=[1.5 * inch] * 4)
    style_commands = [
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for idx, (_, _, bg, _) in enumerate(cards):
        style_commands.append(('BACKGROUND', (idx, 0), (idx, -1), bg))
        style_commands.append(('BOX', (idx, 0), (idx, -1), 0.5, _PDF_COLORS['border']))
    table.setStyle(TableStyle(style_commands))
    return table


def _fmt_currency(value):
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0.0
    return f'R {amount:,.2f}'


def _pdf_section_table(title, rows, accent=None, accent_light=None, col_widths=None):
    """Build a titled two-column table with colored header."""
    accent = accent or _PDF_COLORS['accent']
    accent_light = accent_light or _PDF_COLORS['accent_light']
    title_style = ParagraphStyle(
        'SectionTitle',
        fontSize=11,
        textColor=_PDF_COLORS['white'],
        fontName='Helvetica-Bold',
    )
    data = [[Paragraph(title, title_style), '']]
    data.extend(rows)
    table = Table(data, colWidths=col_widths or [3.2 * inch, 2.8 * inch])
    style_commands = [
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (1, 0), accent),
        ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor('#334155')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('TEXTCOLOR', (1, 1), (1, -1), colors.HexColor('#0f172a')),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, _PDF_COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]
    for row_idx in range(1, len(data)):
        bg = _PDF_COLORS['row_alt'] if row_idx % 2 == 0 else _PDF_COLORS['white']
        style_commands.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))
    table.setStyle(TableStyle(style_commands))
    return table


def _pdf_data_table(title, headers, rows, accent, accent_light):
    """Three-column data table with colored section header."""
    title_style = ParagraphStyle(
        'DataTitle',
        fontSize=11,
        textColor=_PDF_COLORS['white'],
        fontName='Helvetica-Bold',
    )
    table_data = [[Paragraph(title, title_style), '', '']] + [headers] + rows
    table = Table(table_data, colWidths=[1.5 * inch, 2.8 * inch, 1.7 * inch])
    style_commands = [
        ('SPAN', (0, 0), (2, 0)),
        ('BACKGROUND', (0, 0), (2, 0), accent),
        ('BACKGROUND', (0, 1), (2, 1), accent_light),
        ('TEXTCOLOR', (0, 1), (2, 1), accent),
        ('FONTNAME', (0, 1), (2, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (2, 1), 9),
        ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
        ('FONTNAME', (2, 2), (2, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2, 2), (2, -1), _PDF_COLORS['success']),
        ('GRID', (0, 0), (-1, -1), 0.5, _PDF_COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]
    for row_idx in range(2, len(table_data)):
        if row_idx % 2 == 0:
            style_commands.append(('BACKGROUND', (0, row_idx), (-1, row_idx), _PDF_COLORS['row_alt']))
    table.setStyle(TableStyle(style_commands))
    return table


def _pdf_funnel_table(funnel):
    """Quote funnel with color-coded stages."""
    stages = funnel.get('stages') or []
    if not stages:
        return None

    title_style = ParagraphStyle(
        'FunnelTitle',
        fontSize=11,
        textColor=_PDF_COLORS['white'],
        fontName='Helvetica-Bold',
    )
    table_data = [[Paragraph('Quote funnel', title_style), '', '']]
    table_data.append(['Stage', 'Count', 'Share'])

    total = funnel.get('total') or 1
    for idx, stage in enumerate(stages):
        count = stage.get('count', 0)
        share = f'{round((count / total) * 100, 1)}%' if total else '0%'
        table_data.append([stage.get('label', ''), str(count), share])

    table = Table(table_data, colWidths=[2.4 * inch, 1.3 * inch, 2.3 * inch])
    style_commands = [
        ('SPAN', (0, 0), (2, 0)),
        ('BACKGROUND', (0, 0), (2, 0), _PDF_COLORS['violet']),
        ('BACKGROUND', (0, 1), (2, 1), _PDF_COLORS['violet_light']),
        ('TEXTCOLOR', (0, 1), (2, 1), _PDF_COLORS['violet']),
        ('FONTNAME', (0, 1), (2, 1), 'Helvetica-Bold'),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),
        ('FONTNAME', (1, 2), (1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, _PDF_COLORS['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]
    for idx, stage in enumerate(stages):
        row_idx = idx + 2
        bg_hex, text_hex = _FUNNEL_STAGE_COLORS[idx % len(_FUNNEL_STAGE_COLORS)]
        style_commands.append(('BACKGROUND', (0, row_idx), (0, row_idx), colors.HexColor(bg_hex)))
        style_commands.append(('TEXTCOLOR', (0, row_idx), (0, row_idx), colors.HexColor(text_hex)))
        style_commands.append(('FONTNAME', (0, row_idx), (0, row_idx), 'Helvetica-Bold'))
        if row_idx % 2 == 0:
            style_commands.append(('BACKGROUND', (1, row_idx), (2, row_idx), _PDF_COLORS['row_alt']))
    table.setStyle(TableStyle(style_commands))
    return table


def financial_dashboard_pdf(data):
    """Build PDF export from dashboard payload."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=48, leftMargin=48, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    elements = _pdf_brand_header(
        styles,
        data.get('period_label', ''),
        data.get('start_date'),
        data.get('end_date'),
    )
    elements.append(_pdf_kpi_cards(data))
    elements.append(Spacer(1, 0.2 * inch))

    vat = data.get('vat_summary') or {}
    elements.append(
        _pdf_section_table(
            'Financial summary',
            [
                ['Period revenue', _fmt_currency(data.get('period_revenue', data.get('total_revenue')))],
                ['VAT collected', _fmt_currency(vat.get('vat_collected'))],
                ['Subtotal (ex VAT)', _fmt_currency(vat.get('subtotal_collected'))],
                ['Gross collected', _fmt_currency(vat.get('total_collected'))],
                ['Average invoice', _fmt_currency(data.get('average_invoice_value'))],
                ['Paid invoices in period', str(vat.get('paid_invoice_count', 0))],
            ],
            accent=_PDF_COLORS['accent'],
            accent_light=_PDF_COLORS['accent_light'],
        )
    )
    elements.append(Spacer(1, 0.16 * inch))

    elements.append(
        _pdf_section_table(
            'Collections health',
            [
                ['Outstanding balance', _fmt_currency(data.get('unpaid_invoices_total'))],
                ['Open invoices', str(data.get('unpaid_invoices_count', 0))],
                ['Overdue balance', _fmt_currency(data.get('overdue_invoices_total'))],
                ['Overdue invoices', str(data.get('overdue_invoices_count', 0))],
                ['Partially paid balance', _fmt_currency(data.get('partially_paid_total'))],
                ['Collection rate', f"{data.get('collection_rate_pct', 0)}%"],
            ],
            accent=_PDF_COLORS['warning'],
            accent_light=_PDF_COLORS['warning_light'],
        )
    )
    elements.append(Spacer(1, 0.16 * inch))

    funnel_table = _pdf_funnel_table(data.get('quote_funnel') or {})
    if funnel_table:
        elements.append(funnel_table)
        elements.append(Spacer(1, 0.16 * inch))

    upcoming = data.get('upcoming_due') or []
    if upcoming:
        upcoming_rows = [
            [
                row.get('invoice_number') or '',
                f"{row.get('client_name') or ''} · due {row.get('due_date') or '—'}",
                _fmt_currency(row.get('amount_due')),
            ]
            for row in upcoming
        ]
        elements.append(
            _pdf_data_table(
                'Upcoming due invoices (next 14 days)',
                ['Invoice', 'Client / due date', 'Amount due'],
                upcoming_rows,
                _PDF_COLORS['info'],
                _PDF_COLORS['info_light'],
            )
        )
        elements.append(Spacer(1, 0.16 * inch))

    collections = data.get('recent_collections') or []
    if collections:
        collection_rows = [
            [
                row.get('invoice_number') or '',
                f"{row.get('client_name') or ''} · paid {row.get('paid_date') or '—'}",
                _fmt_currency(row.get('amount')),
            ]
            for row in collections
        ]
        elements.append(
            _pdf_data_table(
                'Recent collections',
                ['Invoice', 'Client / paid date', 'Amount'],
                collection_rows,
                _PDF_COLORS['success'],
                _PDF_COLORS['success_light'],
            )
        )

    generated = timezone.now().strftime('%d %B %Y at %H:%M')
    footer = Table(
        [[Paragraph(
            f'Generated {generated} · {getattr(settings, "BRAND_NAME", "PathyCode")} · Confidential',
            ParagraphStyle('Footer', fontSize=8, textColor=_PDF_COLORS['muted'], alignment=TA_RIGHT),
        )]],
        colWidths=[6 * inch],
    )
    footer.setStyle(
        TableStyle([
            ('LINEABOVE', (0, 0), (-1, -1), 0.5, _PDF_COLORS['border']),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
        ])
    )
    elements.append(Spacer(1, 0.25 * inch))
    elements.append(footer)

    doc.build(elements)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="financial-dashboard.pdf"'
    return response


def financial_dashboard_csv(*, period='month', start_str=None, end_str=None, upcoming_days=14):
    """
    Accountant-friendly CSV pack for the selected period.

    Sections: summary, paid invoices, outstanding invoices, VAT summary, PayFast payment log.
    """
    from PathyCodeback.csv_export import branded_csv_response
    from invoices.models import Invoice
    from payments.models import Payment as ExternalPayment

    data = build_financial_dashboard(
        period=period,
        start_str=start_str,
        end_str=end_str,
        upcoming_days=upcoming_days,
    )
    today = timezone.now().date()
    start, end, period_label = resolve_date_range(period, start_str, end_str, today)

    response, writer = branded_csv_response(
        'financial-dashboard-accountant.csv',
        'Financial Dashboard — Accountant Export',
        f'Period: {period_label}. Includes paid/outstanding invoices, VAT, and PayFast payment log.',
    )

    vat = data.get('vat_summary') or {}
    writer.writerow(['Section', 'Summary'])
    writer.writerow(['Period', period_label])
    writer.writerow(['Period revenue', data.get('period_revenue', data.get('total_revenue'))])
    writer.writerow(['VAT collected (period)', vat.get('vat_collected')])
    writer.writerow(['VAT collected (YTD)', vat.get('vat_ytd')])
    writer.writerow(['Outstanding balance', data.get('unpaid_invoices_total')])
    writer.writerow(['Overdue balance', data.get('overdue_invoices_total')])
    writer.writerow(['Collection rate %', data.get('collection_rate_pct')])
    smart = data.get('smart_metrics') or {}
    writer.writerow(['DSO (days)', smart.get('dso_days')])
    forecast = data.get('cash_forecast') or {}
    writer.writerow(['Expected collections (30d)', forecast.get('expected_total')])
    writer.writerow([])

    open_statuses = ('paid', 'cancelled')
    paid_qs = Invoice.objects.filter(status='paid')
    paid_qs = _filter_paid_by_period(paid_qs, start, end)
    writer.writerow(['Section', 'Paid invoices'])
    writer.writerow([
        'Invoice Number', 'Client', 'Issue Date', 'Paid Date',
        'Subtotal', 'VAT', 'Total', 'Service Type',
    ])
    for inv in paid_qs.select_related('quote').order_by('-paid_date', '-id'):
        writer.writerow([
            inv.invoice_number,
            inv.client_name,
            inv.issue_date.isoformat() if inv.issue_date else '',
            inv.paid_date.isoformat() if inv.paid_date else '',
            float(inv.subtotal),
            float(inv.vat_amount),
            float(inv.total_amount),
            getattr(inv.quote, 'service_type', None) or '',
        ])
    writer.writerow([])

    writer.writerow(['Section', 'Outstanding invoices'])
    writer.writerow([
        'Invoice Number', 'Client', 'Status', 'Issue Date', 'Due Date',
        'Total', 'Amount Paid', 'Amount Due',
    ])
    for inv in Invoice.objects.exclude(status__in=open_statuses).order_by('due_date', 'id'):
        writer.writerow([
            inv.invoice_number,
            inv.client_name,
            inv.status,
            inv.issue_date.isoformat() if inv.issue_date else '',
            inv.due_date.isoformat() if inv.due_date else '',
            float(inv.total_amount),
            float(inv.amount_paid),
            float(inv.amount_due),
        ])
    writer.writerow([])

    writer.writerow(['Section', 'VAT summary'])
    writer.writerow(['Metric', 'Amount'])
    writer.writerow(['VAT collected (period)', vat.get('vat_collected')])
    writer.writerow(['Subtotal ex VAT (period)', vat.get('subtotal_collected')])
    writer.writerow(['Gross collected (period)', vat.get('total_collected')])
    writer.writerow(['VAT year to date', vat.get('vat_ytd')])
    writer.writerow([])

    writer.writerow(['Section', 'PayFast payment log'])
    writer.writerow([
        'Payment ID', 'Quote ID', 'Client', 'Status', 'Amount', 'Currency', 'Paid At', 'Created At',
    ])
    ext_qs = ExternalPayment.objects.select_related('client', 'quote').order_by('-created_at')
    if start and end:
        ext_qs = ext_qs.filter(created_at__date__gte=start, created_at__date__lte=end)
    for pay in ext_qs:
        writer.writerow([
            pay.id,
            pay.quote_id,
            getattr(pay.client, 'name', '') or '',
            pay.payment_status,
            float(pay.amount),
            pay.currency,
            pay.paid_at.isoformat() if pay.paid_at else '',
            pay.created_at.isoformat() if pay.created_at else '',
        ])
    writer.writerow([])

    writer.writerow(['Section', 'Finance activity log'])
    writer.writerow(['Timestamp', 'Action', 'Staff', 'Object', 'Details'])
    for entry in data.get('finance_activity') or []:
        obj_ref = ''
        if entry.get('object_type') and entry.get('object_id'):
            obj_ref = f"{entry['object_type']} #{entry['object_id']}"
        writer.writerow([
            entry.get('timestamp', ''),
            entry.get('label', entry.get('action', '')),
            entry.get('user_name', ''),
            obj_ref,
            entry.get('details', ''),
        ])

    return response
