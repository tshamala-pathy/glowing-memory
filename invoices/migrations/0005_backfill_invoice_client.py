# Backfill Invoice.client from quote.client

from django.db import migrations


def backfill_invoice_client(apps, schema_editor):
    Invoice = apps.get_model('invoices', 'Invoice')
    for inv in Invoice.objects.filter(client__isnull=True).select_related('quote'):
        if inv.quote_id and getattr(inv.quote, 'client_id', None):
            inv.client_id = inv.quote.client_id
            inv.save(update_fields=['client_id'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0004_backfill_quote_client'),
        ('invoices', '0004_add_invoice_client_fk'),
    ]

    operations = [
        migrations.RunPython(backfill_invoice_client, noop),
    ]
