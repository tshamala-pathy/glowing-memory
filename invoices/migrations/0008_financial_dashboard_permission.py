from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0007_workflow_quote_payment_project'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='invoice',
            options={
                'ordering': ['-created_at'],
                'permissions': [('view_financial_dashboard', 'Can view financial dashboard')],
                'verbose_name': 'Invoice',
                'verbose_name_plural': 'Invoices',
            },
        ),
    ]
