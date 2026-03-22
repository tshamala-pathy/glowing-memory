# Add paid_at; migrate status to lowercase (draft, unpaid, paid, overdue, cancelled)

from datetime import datetime

from django.db import migrations, models
from django.utils import timezone


def migrate_status_and_paid_at(apps, schema_editor):
    Invoice = apps.get_model('invoices', 'Invoice')
    status_map = {
        'Draft': 'draft',
        'Sent': 'unpaid',
        'Paid': 'paid',
        'Overdue': 'overdue',
        'Cancelled': 'cancelled',
    }
    for inv in Invoice.objects.all():
        if inv.status in status_map:
            inv.status = status_map[inv.status]
        if inv.status == 'paid' and inv.paid_date and not inv.paid_at:
            dt = datetime.combine(inv.paid_date, datetime.min.time())
            inv.paid_at = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
        inv.save(update_fields=['status', 'paid_at'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0005_backfill_invoice_client'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='paid_at',
            field=models.DateTimeField(blank=True, null=True, help_text='Timestamp when invoice was marked paid (by admin)'),
        ),
        migrations.RunPython(migrate_status_and_paid_at, noop),
    ]
