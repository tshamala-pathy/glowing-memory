# Backfill Quote.client from client_email (User -> Client)

from django.db import migrations


def backfill_quote_client(apps, schema_editor):
    Quote = apps.get_model('quotes', 'Quote')
    Client = apps.get_model('clients', 'Client')
    for quote in Quote.objects.filter(client__isnull=True).exclude(client_email=''):
        client = Client.objects.filter(user__email__iexact=quote.client_email).first()
        if client:
            quote.client = client
            quote.save(update_fields=['client'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0003_add_quote_client_fk'),
    ]

    operations = [
        migrations.RunPython(backfill_quote_client, noop),
    ]
