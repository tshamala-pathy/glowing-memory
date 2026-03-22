from django.db import migrations, models

def migrate_title_to_name(apps, schema_editor):
    Service = apps.get_model('services', 'Service')
    for service in Service.objects.all():
        # Only copy title → name if name is empty or default
        if (not service.name or service.name == "Service") and service.title:
            service.name = service.title
            service.save()

class Migration(migrations.Migration):

    dependencies = [
        ('services', '0001_initial'),
    ]

    operations = [
        # 👉 Ensure the name field is added FIRST before running Python code
        migrations.AddField(
            model_name='service',
            name='name',
            field=models.CharField(
                max_length=255,
                default='Service',
            ),
        ),

        # Run data migration
        migrations.RunPython(migrate_title_to_name),
    ]
