# Generated migration - manually edited to handle data migration safely

from django.db import migrations, models
import django.db.models.deletion


def handle_existing_invoices(apps, schema_editor):
    """
    Handle existing invoices that might not have quotes.
    Delete invoices without quotes as they cannot exist in the new system.
    """
    Invoice = apps.get_model('invoices', 'Invoice')
    
    # Find invoices without quotes
    invoices_without_quotes = Invoice.objects.filter(quote__isnull=True)
    
    if invoices_without_quotes.exists():
        count = invoices_without_quotes.count()
        print(f"\n⚠️  WARNING: Found {count} invoice(s) without quotes.")
        print("These invoices will be deleted as invoices must be linked to quotes.")
        invoices_without_quotes.delete()
        print(f"Deleted {count} invoice(s) without quotes.")


def reverse_migration(apps, schema_editor):
    """
    Reverse migration - not fully reversible as we deleted data.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0001_initial'),
        ('quotes', '0002_quote_admin_response_quote_replied_at_and_more'),
    ]

    operations = [
        # Step 1: Handle existing invoices without quotes
        migrations.RunPython(handle_existing_invoices, reverse_migration),
        
        # Step 2: Remove the old ForeignKey relationship
        migrations.RemoveField(
            model_name='invoice',
            name='quote',
        ),
        
        # Step 3: Add the new OneToOneField (temporarily nullable)
        migrations.AddField(
            model_name='invoice',
            name='quote',
            field=models.OneToOneField(
                help_text='The approved quote this invoice is based on. Quote must be approved before invoice creation.',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='invoice',
                to='quotes.quote',
                null=True,  # Temporarily nullable
                blank=True,  # Temporarily blank
            ),
        ),
        
        # Step 4: Make it non-nullable (after ensuring all invoices have quotes)
        migrations.AlterField(
            model_name='invoice',
            name='quote',
            field=models.OneToOneField(
                help_text='The approved quote this invoice is based on. Quote must be approved before invoice creation.',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='invoice',
                to='quotes.quote',
            ),
        ),
    ]
