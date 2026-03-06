# Backfill Project.client_entity from Project.client (User), then replace client with Client FK

from django.db import migrations


def backfill_client_entity(apps, schema_editor):
    Project = apps.get_model('clients', 'Project')
    Client = apps.get_model('clients', 'Client')
    for project in Project.objects.filter(client__isnull=False).select_related('client'):
        try:
            client_profile = Client.objects.get(user=project.client)
            project.client_entity = client_profile
            project.save(update_fields=['client_entity'])
        except Client.DoesNotExist:
            pass


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0005_add_quote_client_fk'),
    ]

    operations = [
        migrations.RunPython(backfill_client_entity, noop),
        migrations.RemoveField(
            model_name='project',
            name='client',
        ),
        migrations.RenameField(
            model_name='project',
            old_name='client_entity',
            new_name='client',
        ),
    ]
